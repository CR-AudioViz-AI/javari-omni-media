// app/admin/users/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { 
  Shield, Users, Clock, Globe, Monitor, Download, 
  Settings, Eye, EyeOff, UserPlus, Trash2, Lock,
  CheckCircle2, XCircle, AlertTriangle, Info
} from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [restrictions, setRestrictions] = useState<any>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadRestrictions(selectedUser.id)
    }
  }, [selectedUser])

  const loadUsers = async () => {
    // TODO: API call
    setUsers([])
  }

  const loadRestrictions = async (userId: string) => {
    // TODO: API call
    setRestrictions({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-500" />
                Access Control
              </h1>
              <p className="text-slate-400 mt-1">Manage users and permissions with precision</p>
            </div>
            
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Users List */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Users</CardTitle>
                <CardDescription>Select a user to manage permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Admin */}
                <UserCard
                  name="Roy Henderson"
                  email="roy@craudiovizai.com"
                  role="admin"
                  status="active"
                  onClick={() => setSelectedUser({ id: '1', name: 'Roy Henderson', role: 'admin' })}
                  selected={selectedUser?.id === '1'}
                />
                
                {/* Family */}
                <UserCard
                  name="Cindy Henderson"
                  email="cindy@craudiovizai.com"
                  role="family"
                  status="active"
                  onClick={() => setSelectedUser({ id: '2', name: 'Cindy Henderson', role: 'family' })}
                  selected={selectedUser?.id === '2'}
                />
                
                {/* Restricted (Kid) */}
                <UserCard
                  name="Kid Account"
                  email="kid@family.com"
                  role="restricted"
                  status="active"
                  pinProtected
                  onClick={() => setSelectedUser({ id: '3', name: 'Kid Account', role: 'restricted' })}
                  selected={selectedUser?.id === '3'}
                />
                
                {/* Friend */}
                <UserCard
                  name="Friend"
                  email="friend@example.com"
                  role="friend"
                  status="active"
                  onClick={() => setSelectedUser({ id: '4', name: 'Friend', role: 'friend' })}
                  selected={selectedUser?.id === '4'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Permissions Panel */}
          <div className="col-span-12 lg:col-span-8">
            {selectedUser ? (
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedUser.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="secondary" className="mt-2">
                          {selectedUser.role.toUpperCase()}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Remove User
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid grid-cols-5 w-full bg-slate-800/50">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="access">Access</TabsTrigger>
                      <TabsTrigger value="time">Time</TabsTrigger>
                      <TabsTrigger value="devices">Devices</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="space-y-6 mt-6">
                      {/* Library Access */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Eye className="w-5 h-5 text-purple-400" />
                          Library Access
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <PermissionToggle label="Movies" icon="🎬" enabled />
                          <PermissionToggle label="TV Shows" icon="📺" enabled />
                          <PermissionToggle label="Cartoons" icon="🎨" enabled />
                          <PermissionToggle label="Documentaries" icon="🎥" enabled />
                          <PermissionToggle label="Music" icon="🎵" enabled={false} />
                          <PermissionToggle label="Photos" icon="📸" enabled={false} />
                          <PermissionToggle label="Adult Content" icon="🔞" enabled={false} danger />
                          <PermissionToggle label="Home Videos" icon="📹" enabled={false} />
                        </div>
                      </div>

                      {/* Content Ratings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-400" />
                          Content Ratings
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white mb-2 block">Maximum Rating</Label>
                            <Select defaultValue="PG-13">
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="G">G - General Audiences</SelectItem>
                                <SelectItem value="PG">PG - Parental Guidance</SelectItem>
                                <SelectItem value="PG-13">PG-13 - Parents Strongly Cautioned</SelectItem>
                                <SelectItem value="R">R - Restricted</SelectItem>
                                <SelectItem value="NC-17">NC-17 - Adults Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-slate-400 mt-1">
                              User can only access content rated PG-13 and below
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                            <div>
                              <Label className="text-white">Require PIN for Rated Content</Label>
                              <p className="text-sm text-slate-400">Ask for PIN when playing R-rated content</p>
                            </div>
                            <Switch />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                            <div>
                              <Label className="text-white">Hide Adult Content</Label>
                              <p className="text-sm text-slate-400">Completely hide from search and browse</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ACCESS TAB */}
                    <TabsContent value="access" className="space-y-6 mt-6">
                      {/* Access Type */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-purple-400" />
                          Access Type
                        </h3>
                        
                        <Select defaultValue="both">
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Local & Remote Access</SelectItem>
                            <SelectItem value="local">Local Only (Home Network)</SelectItem>
                            <SelectItem value="remote">Remote Only (Away from Home)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* IP Restrictions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-purple-400" />
                          IP Restrictions
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-white mb-2 block">Allowed IPs (Whitelist)</Label>
                            <Input 
                              placeholder="192.168.1.0/24, 10.0.0.100"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                            <p className="text-sm text-slate-400 mt-1">
                              Leave empty to allow all IPs. Separate multiple with commas.
                            </p>
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">Blocked IPs (Blacklist)</Label>
                            <Input 
                              placeholder="203.0.113.0, 198.51.100.0"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* VPN Requirement */}
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white">Require VPN for Remote Access</Label>
                          <p className="text-sm text-slate-400">Force VPN connection when accessing remotely</p>
                        </div>
                        <Switch />
                      </div>

                      {/* Bandwidth Limits */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Download className="w-5 h-5 text-purple-400" />
                          Bandwidth Limits
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white mb-2 block">Maximum Resolution</Label>
                            <Select defaultValue="1080p">
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="4k">4K (2160p)</SelectItem>
                                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                                <SelectItem value="720p">720p (HD)</SelectItem>
                                <SelectItem value="480p">480p (SD)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">Maximum Bitrate: 8 Mbps</Label>
                            <Slider 
                              defaultValue={[8]} 
                              max={20} 
                              step={1}
                              className="mt-2"
                            />
                            <p className="text-sm text-slate-400 mt-1">
                              Limit bandwidth usage for this user
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TIME TAB */}
                    <TabsContent value="time" className="space-y-6 mt-6">
                      {/* Bedtime Mode */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Bedtime Mode
                          </h3>
                          <Switch />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white mb-2 block">Bedtime Starts</Label>
                            <Input 
                              type="time" 
                              defaultValue="21:00"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white mb-2 block">Bedtime Ends</Label>
                            <Input 
                              type="time" 
                              defaultValue="07:00"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                          <p className="text-sm text-blue-300 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            Access blocked from 9:00 PM to 7:00 AM every day
                          </p>
                        </div>
                      </div>

                      {/* Screen Time Limits */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Screen Time Limits
                          </h3>
                          <Switch defaultChecked />
                        </div>
                        
                        <div>
                          <Label className="text-white mb-2 block">Daily Limit: 2 hours</Label>
                          <Slider 
                            defaultValue={[120]} 
                            max={480} 
                            step={30}
                            className="mt-2"
                          />
                          <p className="text-sm text-slate-400 mt-1">
                            Maximum viewing time per day
                          </p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Today's Usage</span>
                            <span className="text-white font-semibold">45 min / 2 hrs</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{ width: '38%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-400" />
                          Weekly Schedule
                        </h3>
                        
                        <div className="space-y-2">
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <Label className="text-white">{day}</Label>
                              <div className="flex items-center gap-4">
                                <Input 
                                  type="time" 
                                  defaultValue="08:00"
                                  className="bg-slate-700 border-slate-600 text-white w-32"
                                />
                                <span className="text-slate-400">to</span>
                                <Input 
                                  type="time" 
                                  defaultValue="20:00"
                                  className="bg-slate-700 border-slate-600 text-white w-32"
                                />
                                <Switch defaultChecked={i < 5} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* DEVICES TAB */}
                    <TabsContent value="devices" className="space-y-6 mt-6">
                      {/* Device Limits */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Monitor className="w-5 h-5 text-purple-400" />
                          Concurrent Devices
                        </h3>
                        
                        <div>
                          <Label className="text-white mb-2 block">Maximum Devices: 2</Label>
                          <Slider 
                            defaultValue={[2]} 
                            max={10} 
                            step={1}
                            className="mt-2"
                          />
                          <p className="text-sm text-slate-400 mt-1">
                            Number of devices that can stream simultaneously
                          </p>
                        </div>
                      </div>

                      {/* Active Devices */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Active Devices</h3>
                        
                        <div className="space-y-2">
                          <DeviceCard
                            name="iPhone 15 Pro"
                            type="Mobile"
                            ip="192.168.1.105"
                            lastActive="2 minutes ago"
                            active
                          />
                          <DeviceCard
                            name="Living Room TV"
                            type="Apple TV"
                            ip="192.168.1.110"
                            lastActive="1 hour ago"
                          />
                        </div>
                      </div>

                      {/* Device Whitelist */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Device Whitelist</h3>
                          <Switch />
                        </div>
                        <p className="text-sm text-slate-400">
                          When enabled, only approved devices can access content
                        </p>
                      </div>
                    </TabsContent>

                    {/* FEATURES TAB */}
                    <TabsContent value="features" className="space-y-6 mt-6">
                      <div className="space-y-3">
                        <FeatureToggle 
                          label="Download Content"
                          description="Allow downloading for offline viewing"
                          enabled={false}
                        />
                        <FeatureToggle 
                          label="Share Content"
                          description="Share collections and recommendations"
                          enabled
                        />
                        <FeatureToggle 
                          label="Create Collections"
                          description="Create and organize custom collections"
                          enabled
                        />
                        <FeatureToggle 
                          label="Edit Metadata"
                          description="Modify titles, descriptions, posters"
                          enabled={false}
                        />
                        <FeatureToggle 
                          label="Delete Content"
                          description="Remove files from library"
                          enabled={false}
                          danger
                        />
                        <FeatureToggle 
                          label="Invite Users"
                          description="Send invitations to new users"
                          enabled={false}
                        />
                        <FeatureToggle 
                          label="Watch History Visible to Parents"
                          description="Parent account can see viewing activity"
                          enabled
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-16 h-16 text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a User</h3>
                  <p className="text-slate-400 text-center max-w-md">
                    Choose a user from the list to view and manage their permissions and restrictions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function UserCard({ name, email, role, status, pinProtected, onClick, selected }: any) {
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    family: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    friend: 'bg-green-600/20 text-green-300 border-green-500/30',
    guest: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    restricted: 'bg-red-600/20 text-red-300 border-red-500/30'
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected 
          ? 'bg-purple-600/10 border-purple-500' 
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white">{name}</h4>
            {pinProtected && <Lock className="w-3 h-3 text-yellow-500" />}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{email}</p>
        </div>
        {status === 'active' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      <Badge variant="secondary" className={`mt-2 ${roleColors[role]}`}>
        {role.toUpperCase()}
      </Badge>
    </div>
  )
}

function PermissionToggle({ label, icon, enabled, danger }: any) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      enabled 
        ? danger 
          ? 'bg-red-600/10 border-red-500/30' 
          : 'bg-green-600/10 border-green-500/30'
        : 'bg-slate-800/30 border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className={`text-sm font-medium ${enabled ? 'text-white' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
        <Switch defaultChecked={enabled} />
      </div>
    </div>
  )
}

function FeatureToggle({ label, description, enabled, danger }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
      <div>
        <Label className={`${danger ? 'text-red-400' : 'text-white'}`}>{label}</Label>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <Switch defaultChecked={enabled} />
    </div>
  )
}

function DeviceCard({ name, type, ip, lastActive, active }: any) {
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-purple-400" />
          <div>
            <h4 className="font-semibold text-white">{name}</h4>
            <p className="text-sm text-slate-400">{type} • {ip}</p>
          </div>
        </div>
        <div className="text-right">
          {active ? (
            <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
              Active
            </Badge>
          ) : (
            <span className="text-sm text-slate-400">{lastActive}</span>
          )}
        </div>
      </div>
    </div>
  )
}
