"use client";

import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Manage your account details and preferences.</p>
      </div>

      <div className="max-w-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1.5">First Name</label>
              <input 
                type="text" 
                defaultValue={user?.firstName} 
                disabled
                className="w-full p-2.5 rounded-lg bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] opacity-70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Last Name</label>
              <input 
                type="text" 
                defaultValue={user?.lastName} 
                disabled
                className="w-full p-2.5 rounded-lg bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] opacity-70"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email} 
              disabled
              className="w-full p-2.5 rounded-lg bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] opacity-70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Role</label>
            <div className="inline-flex px-3 py-1 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-sm font-medium capitalize">
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
