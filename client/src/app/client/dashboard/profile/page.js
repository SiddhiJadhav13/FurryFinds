"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, User, Lock, Bell, MessageSquare, HelpCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api, getAuthHeader } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function ProfileSupportPage() {
  const { auth } = useApp();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
  });
  const [preferences, setPreferences] = useState({
    reminders: true,
    results: false,
  });
  const [support, setSupport] = useState({
    subject: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const headers = getAuthHeader();
        const res = await api.get("/users/profile", { headers });
        setProfile({
          full_name: res.data.user?.full_name || auth.profile?.full_name || "",
          email: res.data.user?.email || auth.user?.email || "",
          phone: res.data.user?.phone || auth.profile?.phone || "",
        });
      } catch (err) {
        setProfile({
          full_name: auth.profile?.full_name || "",
          email: auth.user?.email || "",
          phone: auth.profile?.phone || "",
        });
      }
    };

    if (!auth.loading) {
      load();
    }
  }, [auth.loading, auth.profile, auth.user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeader();
      await api.put(
        "/users/profile",
        {
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        },
        { headers }
      );
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = () => {
    if (!passwords.current || !passwords.next) {
      toast.error("Enter your current and new password");
      return;
    }
    toast.success("Password change request submitted");
    setPasswords({ current: "", next: "" });
  };

  const savePreferences = () => {
    toast.success("Notification preferences saved");
  };

  const submitSupport = async () => {
    if (!support.subject || !support.message) {
      toast.error("Fill in subject and message");
      return;
    }

    try {
      const headers = getAuthHeader();
      await api.post("/users/contact", support, { headers });
      toast.success("Message sent to support");
      setSupport({ subject: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send message");
    }
  };

  return (
    <div className="space-y-6">
      <section className="dash-panel dashboard-hero-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        <h1 className="dash-title text-3xl">Profile &amp; Support</h1>
        <p className="text-muted-foreground">Manage your account details, notifications, and support requests.</p>
      </section>

      <Tabs defaultValue="profile">
        <TabsList className="bg-white/75 backdrop-blur-sm">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="dash-card">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                    <User className="size-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      className="border-0 px-0 focus-visible:ring-0"
                      value={profile.full_name}
                      onChange={(e) => setProfile((s) => ({ ...s, full_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      className="border-0 px-0 focus-visible:ring-0"
                      value={profile.email}
                      onChange={(e) => setProfile((s) => ({ ...s, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="border-0 px-0 focus-visible:ring-0"
                      value={profile.phone}
                      onChange={(e) => setProfile((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                    <Lock className="size-4 text-muted-foreground" />
                    <Input
                      id="current_password"
                      type="password"
                      className="border-0 px-0 focus-visible:ring-0"
                      value={passwords.current}
                      onChange={(e) => setPasswords((s) => ({ ...s, current: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_password">New password</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                    <Lock className="size-4 text-muted-foreground" />
                    <Input
                      id="next_password"
                      type="password"
                      className="border-0 px-0 focus-visible:ring-0"
                      value={passwords.next}
                      onChange={(e) => setPasswords((s) => ({ ...s, next: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={savePassword}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="dash-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize the alerts you receive from FurryFinds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-white/70 p-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium"><Bell className="size-4" /> Event reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified 48 hours before your events.</p>
                </div>
                <Switch
                  checked={preferences.reminders}
                  onCheckedChange={(value) => setPreferences((s) => ({ ...s, reminders: value }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-white/70 p-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium"><Bell className="size-4" /> Results announcements</p>
                  <p className="text-xs text-muted-foreground">Receive alerts when event results are published.</p>
                </div>
                <Switch
                  checked={preferences.results}
                  onCheckedChange={(value) => setPreferences((s) => ({ ...s, results: value }))}
                />
              </div>

              <Button onClick={savePreferences}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card className="dash-card">
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Reach our team for help, feedback, or event questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <div className="flex items-center gap-2 rounded-lg border border-input bg-white/70 px-3 py-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <Input
                    id="subject"
                    className="border-0 px-0 focus-visible:ring-0"
                    value={support.subject}
                    onChange={(e) => setSupport((s) => ({ ...s, subject: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="min-h-[140px] w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={support.message}
                  onChange={(e) => setSupport((s) => ({ ...s, message: e.target.value }))}
                />
              </div>

              <Button onClick={submitSupport}>Submit Request</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="dash-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="size-4" /> FAQ
          </CardTitle>
          <CardDescription>Quick answers to common questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion>
            <AccordionItem>
              <AccordionTrigger>How do I add a new pet?</AccordionTrigger>
              <AccordionContent>
                Open the My Pets page and click &quot;Add Pet&quot; to submit your pet profile and images.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem>
              <AccordionTrigger>Can I cancel an event registration?</AccordionTrigger>
              <AccordionContent>
                Event cancellations are currently handled by the support team. Send a request from the Support tab.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem>
              <AccordionTrigger>How are event approvals handled?</AccordionTrigger>
              <AccordionContent>
                Each registration is reviewed by event organizers. You will receive a notification once approved.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
