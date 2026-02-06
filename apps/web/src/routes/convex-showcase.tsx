import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@microhack/backend/convex/_generated/api";
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  RiTruckLine,
  RiCalendarLine,
  RiBuilding2Line,
  RiGroupLine,
  RiNotification3Line,
  RiRobot2Line,
  RiSettings3Line,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiAddLine,
  RiTimeLine,
  RiDatabase2Line,
} from "@remixicon/react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

// Import feature components
import { CarrierList, CreateCarrierForm } from "@/features/carriers";
import { TerminalList, CreateTerminalForm } from "@/features/terminals";
import { GateList, CreateGateForm } from "@/features/gates";
import { TruckList, CreateTruckForm } from "@/features/trucks";

export const Route = createFileRoute("/convex-showcase")({
  component: ConvexShowcase,
});

function ConvexShowcase() {
  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Convex Features Showcase
              </h1>
              <p className="text-muted-foreground mt-2">
                Interactive testing playground for all Convex backend features
              </p>
            </div>

            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="bookings" className="gap-2">
                  <RiCalendarLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="trucks" className="gap-2">
                  <RiTruckLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Trucks</span>
                </TabsTrigger>
                <TabsTrigger value="slots" className="gap-2">
                  <RiTimeLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Time Slots</span>
                </TabsTrigger>
                <TabsTrigger value="terminals" className="gap-2">
                  <RiBuilding2Line className="h-4 w-4" />
                  <span className="hidden sm:inline">Terminals</span>
                </TabsTrigger>
                <TabsTrigger value="carriers" className="gap-2">
                  <RiGroupLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Carriers</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <RiNotification3Line className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <RiRobot2Line className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Agent</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-2">
                  <RiSettings3Line className="h-4 w-4" />
                  <span className="hidden sm:inline">System</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-6">
                <BookingsTab />
              </TabsContent>

              <TabsContent value="trucks" className="space-y-6">
                <TrucksTab />
              </TabsContent>

              <TabsContent value="slots" className="space-y-6">
                <TimeSlotsTab />
              </TabsContent>

              <TabsContent value="terminals" className="space-y-6">
                <TerminalsTab />
              </TabsContent>

              <TabsContent value="carriers" className="space-y-6">
                <CarriersTab />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <AIAgentTab />
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <SystemTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <AuthForms />
        </div>
      </Unauthenticated>

      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <RiLoader4Line className="h-8 w-8 animate-spin" />
        </div>
      </AuthLoading>
    </>
  );
}

function AuthForms() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Convex Showcase</CardTitle>
        <CardDescription>Sign in to test Convex features</CardDescription>
      </CardHeader>
      <CardContent>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </CardContent>
    </Card>
  );
}

// Bookings Tab
function BookingsTab() {
  const myBookings = useQuery(api.bookings.queries.listMyBookings, {});
  const bookingCounts = useQuery(api.bookings.queries.countByStatus, {});
  const [newBooking, setNewBooking] = useState({
    truckId: "",
    timeSlotId: "",
    driverName: "",
    driverPhone: "",
  });

  const createBooking = useMutation(api.bookings.mutations.create);
  const confirmBooking = useMutation(api.bookings.mutations.confirm);
  const rejectBooking = useMutation(api.bookings.mutations.reject);
  const cancelBooking = useMutation(api.bookings.mutations.cancel);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiDatabase2Line className="h-5 w-5" />
            My Bookings
          </CardTitle>
          <CardDescription>
            Real-time query: api.bookings.queries.listMyBookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {bookingCounts &&
              Object.entries(bookingCounts).map(([status, count]) => (
                <Badge key={status} variant="secondary">
                  {status}: {count}
                </Badge>
              ))}
          </div>
          <ScrollArea className="h-[300px] border rounded-md p-4">
            {myBookings?.map((booking) => (
              <div key={booking._id} className="mb-4 p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{booking.bookingReference}</div>
                    <div className="text-sm text-muted-foreground">
                      Status:{" "}
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "outline"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(booking._creationTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            confirmBooking({ bookingId: booking._id })
                          }
                        >
                          <RiCheckboxCircleLine className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            rejectBooking({ bookingId: booking._id, reason: "Rejected via showcase" })
                          }
                        >
                          <RiCloseCircleLine className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {(booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          cancelBooking({ bookingId: booking._id })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!myBookings?.length && (
              <div className="text-center text-muted-foreground py-8">
                No bookings found
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Booking</CardTitle>
          <CardDescription>
            Mutation: api.bookings.mutations.create
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Truck ID</label>
            <Input
              placeholder="Enter truck ID"
              value={newBooking.truckId}
              onChange={(e) =>
                setNewBooking({ ...newBooking, truckId: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Slot ID</label>
            <Input
              placeholder="Enter time slot ID"
              value={newBooking.timeSlotId}
              onChange={(e) =>
                setNewBooking({ ...newBooking, timeSlotId: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Driver Name</label>
            <Input
              placeholder="Driver name"
              value={newBooking.driverName}
              onChange={(e) =>
                setNewBooking({ ...newBooking, driverName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Driver Phone</label>
            <Input
              placeholder="Driver phone"
              value={newBooking.driverPhone}
              onChange={(e) =>
                setNewBooking({ ...newBooking, driverPhone: e.target.value })
              }
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              createBooking({
                truckId: newBooking.truckId as Id<"trucks">,
                timeSlotId: newBooking.timeSlotId as Id<"timeSlots">,
                driverName: newBooking.driverName,
                driverPhone: newBooking.driverPhone,
              });
              setNewBooking({
                truckId: "",
                timeSlotId: "",
                driverName: "",
                driverPhone: "",
              });
            }}
            disabled={!newBooking.truckId || !newBooking.timeSlotId}
          >
            <RiAddLine className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Trucks Tab - Using feature components
function TrucksTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <TruckList onCreateClick={() => setIsCreateDialogOpen(true)} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register Truck</DialogTitle>
            <DialogDescription>
              Add a new truck to a carrier's fleet
            </DialogDescription>
          </DialogHeader>
          <CreateTruckForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Time Slots Tab
function TimeSlotsTab() {
  const [selectedGateId, setSelectedGateId] = useState("");
  const [selectedTerminalId, setSelectedTerminalId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const terminals = useQuery(api.terminals.queries.list, {});
  const slots = useQuery(
    api.timeSlots.queries.listByGateAndDate,
    selectedGateId
      ? { gateId: selectedGateId as Id<"gates">, date: selectedDate }
      : "skip",
  );
  const capacity = useQuery(
    api.timeSlots.queries.getTerminalCapacityOverview,
    selectedTerminalId
      ? { terminalId: selectedTerminalId as Id<"terminals">, date: selectedDate }
      : "skip",
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiTimeLine className="h-5 w-5" />
            Time Slots
          </CardTitle>
          <CardDescription>
            Query: api.timeSlots.queries.listByGateAndDate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gate ID</label>
            <Input
              placeholder="Enter gate ID"
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[250px] border rounded-md p-4">
            {slots?.map((slot) => (
              <div key={slot._id} className="mb-3 p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Available: {slot.availableCapacity} / {slot.maxCapacity}
                    </div>
                  </div>
                  <Badge
                    variant={
                      slot.availableCapacity > 0 ? "default" : "destructive"
                    }
                  >
                    {slot.availableCapacity > 0 ? "Open" : "Full"}
                  </Badge>
                </div>
              </div>
            ))}
            {!slots?.length && selectedGateId && (
              <div className="text-center text-muted-foreground py-8">
                No slots found
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity Overview</CardTitle>
          <CardDescription>
            Query: api.timeSlots.queries.getTerminalCapacityOverview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Terminal</label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={selectedTerminalId}
                onChange={(e) => setSelectedTerminalId(e.target.value)}
              >
                <option value="">Select a terminal...</option>
                {terminals?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
            {capacity && (
              <>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">{capacity.terminal.name}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Capacity:</span>{" "}
                      {capacity.summary.totalCapacity}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booked:</span>{" "}
                      {capacity.summary.totalBooked}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Utilization:</span>{" "}
                      {capacity.summary.overallUtilization}%
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Gates</div>
                  {capacity.gates.map((gate) => (
                    <div key={gate._id} className="p-3 border rounded-lg text-sm">
                      <div className="font-medium">{gate.name}</div>
                      <div className="text-muted-foreground">
                        {gate.totalBooked}/{gate.totalCapacity} booked ({gate.utilizationPercent}%)
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!capacity && !selectedTerminalId && (
              <div className="text-center text-muted-foreground py-8">
                Select a terminal to view capacity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Terminals Tab - Using feature components with Gates
function TerminalsTab() {
  const [isCreateTerminalOpen, setIsCreateTerminalOpen] = useState(false);
  const [isCreateGateOpen, setIsCreateGateOpen] = useState(false);

  return (
    <div className="space-y-8">
      <TerminalList onCreateClick={() => setIsCreateTerminalOpen(true)} />

      <div className="border-t pt-8">
        <GateList onCreateClick={() => setIsCreateGateOpen(true)} />
      </div>

      <Dialog open={isCreateTerminalOpen} onOpenChange={setIsCreateTerminalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Terminal</DialogTitle>
            <DialogDescription>
              Add a new terminal to the port system
            </DialogDescription>
          </DialogHeader>
          <CreateTerminalForm
            onSuccess={() => setIsCreateTerminalOpen(false)}
            onCancel={() => setIsCreateTerminalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateGateOpen} onOpenChange={setIsCreateGateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Gate</DialogTitle>
            <DialogDescription>
              Add a new gate to a terminal
            </DialogDescription>
          </DialogHeader>
          <CreateGateForm
            onSuccess={() => setIsCreateGateOpen(false)}
            onCancel={() => setIsCreateGateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Carriers Tab - Using feature components
function CarriersTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const myCompany = useQuery(api.carriers.queries.getMyCompany, {});
  const users = useQuery(api.users.queries.listOperators, {});

  return (
    <div className="space-y-6">
      <CarrierList onCreateClick={() => setIsCreateDialogOpen(true)} />

      {myCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiBuilding2Line className="h-5 w-5" />
              My Company
            </CardTitle>
            <CardDescription>
              Query: api.carriers.queries.getMyCompany
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg">
              <div className="font-medium">{myCompany.name}</div>
              <div className="text-sm text-muted-foreground">
                Code: {myCompany.code}
              </div>
              <Badge className="mt-2">My Company</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiGroupLine className="h-5 w-5" />
            Terminal Operators
          </CardTitle>
          <CardDescription>
            Query: api.users.queries.listOperators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {users?.map((user) => (
              <div key={user.userId} className="mb-3 p-3 border rounded-lg">
                <div className="font-medium text-xs font-mono">{user.userId}</div>
                <div className="text-sm text-muted-foreground">
                  Terminals: {user.assignedTerminals.length}
                </div>
                <Badge variant="secondary" className="mt-2">
                  {user.apcsRole ?? "No role"}
                </Badge>
              </div>
            ))}
            {!users?.length && (
              <div className="text-center text-muted-foreground py-8">
                No operators found
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Carrier Company</DialogTitle>
            <DialogDescription>
              Add a new carrier company to the system
            </DialogDescription>
          </DialogHeader>
          <CreateCarrierForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Notifications Tab
function NotificationsTab() {
  const notifications = useQuery(api.notifications.queries.list, {});
  const unreadCount = useQuery(api.notifications.queries.unreadCount, {});

  const markAsRead = useMutation(api.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.notifications.mutations.markAllAsRead);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiNotification3Line className="h-5 w-5" />
          Notifications
          {unreadCount ? (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Real-time query: api.notifications.queries.list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => markAllAsRead({})}>
            <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
        <ScrollArea className="h-[400px] border rounded-md p-4">
          {notifications?.map((notification) => (
            <div
              key={notification._id}
              className={`mb-3 p-3 border rounded-lg ${!notification.isRead ? "bg-primary/5 border-primary/20" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{notification.titleEn}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.bodyEn}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(notification._creationTime).toLocaleString()}
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      markAsRead({ notificationId: notification._id })
                    }
                  >
                    <RiCheckboxCircleLine className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!notifications?.length && (
            <div className="text-center text-muted-foreground py-8">
              No notifications
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// AI Agent Tab
function AIAgentTab() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant for the truck management system. I can help you with bookings, terminals, and system information. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I received your message: "${userMessage}". In a real implementation, this would use the Convex AI agent with streaming responses via api.ai.chat.initiateStream.`,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiRobot2Line className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Actions: api.ai.chat.createThread, initiateStream, generateResponse
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 border rounded-md p-4 mb-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {msg.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Ask about bookings, terminals, or system status..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Show my bookings")}
          >
            Show my bookings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("List available terminals")}
          >
            List terminals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Check system status")}
          >
            System status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("What can you do?")}
          >
            What can you do?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// System Tab
function SystemTab() {
  const config = useQuery(api.config.queries.get, {});
  const currentUser = useQuery(api.auth.getCurrentUser, {});
  const healthCheck = useQuery(api.healthCheck.get, {});
  const myProfile = useQuery(api.users.queries.getMyProfile, {});

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiSettings3Line className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Query: api.config.queries.get</CardDescription>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">
                  Max Advance Booking (days)
                </span>
                <span className="font-medium">{config.maxAdvanceBookingDays}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">
                  Min Advance Booking (hours)
                </span>
                <span className="font-medium">{config.minAdvanceBookingHours}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">
                  Cancellation Window (hours)
                </span>
                <span className="font-medium">
                  {config.cancellationWindowHours}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reminder Hours</span>
                <span className="font-medium">{config.reminderHoursBefore.join(", ")}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No config data
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiRefreshLine className="h-5 w-5" />
              Health Check
            </CardTitle>
            <CardDescription>Query: api.healthCheck.get</CardDescription>
          </CardHeader>
          <CardContent>
            {healthCheck ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${healthCheck === "OK" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="font-medium capitalize">
                    {healthCheck === "OK" ? "Healthy" : "Unhealthy"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Health check failed
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiGroupLine className="h-5 w-5" />
              Current User
            </CardTitle>
            <CardDescription>
              Query: api.auth.getCurrentUser, api.users.queries.getMyProfile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentUser && myProfile ? (
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{currentUser.email}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {myProfile.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Role</span>
                  <Badge>{myProfile.apcsRole ?? "No role"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{currentUser._id}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Loading user data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
