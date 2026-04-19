"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function KnowledgeDetailPage() {
  const params = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/knowledge/${params.id}`);
      setPost(data.post);
    };

    load();
  }, [params.id]);

  if (!post) {
    return <main className="container simple-center">Loading post...</main>;
  }

  return (
    <main className="container details-page">
      <article className="glass panel knowledge-full">
        <p className="chip">{post.category}</p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div className="article-body">{post.content}</div>
      </article>
    </main>
  );
}
