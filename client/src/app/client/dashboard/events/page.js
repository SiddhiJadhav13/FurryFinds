"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Tag,
  Users,
  Search,
  Filter,
  PawPrint,
  CheckCircle2,
  Clock,
  Sparkles,
  Compass,
} from "lucide-react";
import { addDays, endOfMonth, format, isWithinInterval, startOfMonth } from "date-fns";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api, getAuthHeader } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const getMockEvents = () => [
  {
    id: "evt-1",
    name: "Summer Paw Parade",
    date: format(addDays(new Date(), 12), "yyyy-MM-dd"),
    location: "Austin, TX",
    category: "Dog Show",
    slotsLeft: 12,
    description: "Celebrate the season with a city-wide pet parade, contests, and rescue showcases.",
    rules: "Vaccinated pets only. Pets must be leashed and registered.",
    tags: ["Outdoor", "Family"],
  },
  {
    id: "evt-2",
    name: "Annual Kennel Club Show",
    date: format(addDays(new Date(), 34), "yyyy-MM-dd"),
    location: "Denver, CO",
    category: "Breed Showcase",
    slotsLeft: 6,
    description: "Competitive breed showcase with certified judges and grooming workshops.",
    rules: "Breed certificates required. Check-in 60 minutes before start.",
    tags: ["Premium", "Judged"],
  },
  {
    id: "evt-3",
    name: "Furry Friends Meet and Greet",
    date: format(addDays(new Date(), 18), "yyyy-MM-dd"),
    location: "Seattle, WA",
    category: "Social",
    slotsLeft: 28,
    description: "A relaxed social for pet owners to network and showcase community pets.",
    rules: "All pets must be friendly and on leash.",
    tags: ["Community"],
  },
  {
    id: "evt-4",
    name: "Agility League Qualifiers",
    date: format(addDays(new Date(), 47), "yyyy-MM-dd"),
    location: "Chicago, IL",
    category: "Agility",
    slotsLeft: 3,
    description: "Timed agility course with prizes and qualifiers for national finals.",
    rules: "Proof of training required. Vet clearance mandatory.",
    tags: ["Competitive", "Indoors"],
  },
];

const CATEGORY_OPTIONS = ["All", "Dog Show", "Breed Showcase", "Social", "Agility"];
const DATE_OPTIONS = [
  { label: "Any date", value: "all" },
  { label: "Next 30 days", value: "next30" },
  { label: "This month", value: "thisMonth" },
];

export default function EventsPage() {
  const { auth } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [pets, setPets] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [joinOpen, setJoinOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [joining, setJoining] = useState(false);
  const mockEvents = useMemo(() => getMockEvents(), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeader();
        const userId = auth.user?.id || auth.user?._id;
        const [petsResult, requestsResult] = await Promise.allSettled([
          api.get("/pets", { headers }),
          api.get("/requests/my", { headers }),
        ]);

        if (petsResult.status === "fulfilled") {
          const list = petsResult.value.data.pets || [];
          const mine = userId ? list.filter((pet) => String(pet.postedBy) === String(userId)) : list;
          setPets(mine);
        } else {
          setPets([]);
        }

        if (requestsResult.status === "fulfilled") {
          const requestEvents = (requestsResult.value.data.requests || [])
            .filter((request) => request.requestType === "event")
            .map((request) => {
              const eventName = request.note?.replace("Event registration:", "").trim() || "Event registration";
              return {
                id: request._id,
                name: eventName,
                date: new Date().toISOString().slice(0, 10),
                location: "Event location",
                status: request.status
                  ? request.status[0].toUpperCase() + request.status.slice(1)
                  : "Pending",
                petId: request.pet?._id || request.petId,
                petName: request.pet?.name || "Pet",
              };
            });
          setMyEvents(requestEvents);
        }
      } catch (err) {
        console.warn("Pets load failed", err);
      }

      try {
        const eventsRes = await api.get("/events");
        setEvents(eventsRes.data.events || mockEvents);
      } catch (err) {
        setEvents(mockEvents);
      }

      setLoading(false);
    };

    if (!auth.loading) {
      load();
    }
  }, [auth.loading, auth.user, mockEvents]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return events.filter((event) => {
      const matchSearch = event.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || event.category === category;
      const eventDate = new Date(event.date);

      let matchDate = true;
      if (dateFilter === "next30") {
        const thirty = new Date(now);
        thirty.setDate(now.getDate() + 30);
        matchDate = isWithinInterval(eventDate, { start: now, end: thirty });
      }
      if (dateFilter === "thisMonth") {
        matchDate = isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [events, search, category, dateFilter]);

  const openJoin = (event) => {
    setSelectedEvent(event);
    setSelectedPetId("");
    setDetailsOpen(false);
    setJoinOpen(true);
  };

  const openDetails = (event) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleJoin = async () => {
    if (!selectedEvent) return;
    if (!selectedPetId) {
      toast.error("Select a pet to join this event.");
      return;
    }

    setJoining(true);
    try {
      const headers = getAuthHeader();
      await api.post(
        "/requests",
        {
          petId: selectedPetId,
          requestType: "event",
          note: `Event registration: ${selectedEvent.name}`,
        },
        { headers }
      );

      setMyEvents((prev) => [
        {
          ...selectedEvent,
          status: "Pending",
          petId: selectedPetId,
          petName: pets.find((p) => String(p._id || p.id) === String(selectedPetId))?.name || "Pet",
        },
        ...prev,
      ]);
      toast.success("Event request submitted.");
      setJoinOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to join event.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="dash-panel dashboard-hero-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Discover</p>
            <h1 className="dash-title text-3xl">Events</h1>
            <p className="text-muted-foreground">Discover upcoming pet shows and manage your registrations.</p>
          </div>
          <Badge variant="outline" className="bg-white/80">
            <Sparkles className="mr-1 size-3.5" /> {filteredEvents.length} matching events
          </Badge>
        </div>
      </section>

      <Card className="dash-card">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" /> Filter events
          </CardTitle>
          <CardDescription>Search by category, date, or keyword.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-white/70 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                className="border-0 px-0 focus-visible:ring-0"
                placeholder="Search events"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/75 backdrop-blur-sm">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="mine">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="dash-card dashboard-accent-card flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span>{event.name}</span>
                      <Badge variant="secondary">{event.category}</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="size-4" /> {format(new Date(event.date), "PPP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" /> {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" /> {event.slotsLeft} slots left
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="mr-1 size-3" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto gap-2">
                    <button
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      onClick={() => openDetails(event)}
                    >
                      View Details
                    </button>
                    <button
                      className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                      onClick={() => openJoin(event)}
                    >
                      Join Event
                    </button>
                  </CardFooter>
                </Card>
              ))}
              {filteredEvents.length === 0 && (
                <Card className="dash-card col-span-full">
                  <CardContent className="flex min-h-44 flex-col items-center justify-center text-center">
                    <Compass className="mb-3 size-10 text-muted-foreground/60" />
                    <p className="text-sm font-medium">No events match your filters.</p>
                    <p className="text-xs text-muted-foreground">Try changing category or date filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <div className="grid gap-4">
            {myEvents.length === 0 ? (
              <Card className="dash-card">
                <CardContent className="flex items-center gap-3 py-8">
                  <PawPrint className="size-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No event registrations yet.</p>
                    <p className="text-sm text-muted-foreground">Join an event to see it here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              myEvents.map((event) => (
                <Card key={`${event.id}-${event.petId}`} className="dash-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{event.name}</span>
                      <Badge variant={event.status === "Approved" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="size-4" /> {new Date(event.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4" /> {event.location}
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4" /> Pet: {event.petName}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="size-4" /> Status: {event.status}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm font-medium">{selectedEvent?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedEvent?.location}</p>
            </div>
            <Select value={selectedPetId} onValueChange={setSelectedPetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a pet" />
              </SelectTrigger>
              <SelectContent>
                {pets.length === 0 ? (
                  <SelectItem value="no-pets" disabled>
                    No pets available
                  </SelectItem>
                ) : (
                  pets.map((pet) => (
                    <SelectItem key={pet._id || pet.id} value={String(pet._id || pet.id)}>
                      {pet.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{selectedEvent?.description}</p>
            <p><strong className="text-foreground">Rules:</strong> {selectedEvent?.rules}</p>
            <div className="grid gap-2">
              <span className="flex items-center gap-2"><Calendar className="size-4" /> {selectedEvent ? new Date(selectedEvent.date).toLocaleDateString() : ""}</span>
              <span className="flex items-center gap-2"><MapPin className="size-4" /> {selectedEvent?.location}</span>
              <span className="flex items-center gap-2"><Users className="size-4" /> {selectedEvent?.slotsLeft} slots left</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedEvent && openJoin(selectedEvent)} disabled={!selectedEvent}>
              Join Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
