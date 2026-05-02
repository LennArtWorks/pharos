class MembersEngine {
  members = $state<{ id: string; name: string }[]>([]);
  isLoaded = $state(false);
  isFetching = $state(false);

  async fetch() {
    if (this.isLoaded || this.isFetching) return;
    this.isFetching = true;
    try {
      const res = await fetch('/api/organisation/members', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.members = data.members ?? [];
        this.isLoaded = true;
      }
    } finally {
      this.isFetching = false;
    }
  }

  getName(id: string): string {
    return this.members.find((m) => m.id === id)?.name ?? id;
  }
}

export const membersState = new MembersEngine();
