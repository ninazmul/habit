"use client";

import { useState, useEffect, useTransition } from "react";
import { format, isPast, isToday, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Video,
  MapPin,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getEvents,
  createEvent,
  toggleEventComplete,
  deleteEvent,
} from "@/lib/actions/event.actions";
import { IEvent, EventType } from "@/types/habit";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  EventType,
  { label: string; color: string; bg: string; border: string }
> = {
  meeting: {
    label: "Meeting",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  client_call: {
    label: "Client Call",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  deadline: {
    label: "Deadline",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  event: {
    label: "Event",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  reminder: {
    label: "Reminder",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  personal: {
    label: "Personal",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
};

export default function SchedulePage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "all">("upcoming");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Creation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("meeting");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState("11:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [remindMinutes, setRemindMinutes] = useState(15);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fetched = await getEvents({
        upcomingOnly: timeFilter === "upcoming",
        type: typeFilter,
      });
      setEvents(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeFilter, typeFilter]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter an event title");

    const startDateTime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime || "00:00"}:00`;

    const endDateTime = isAllDay
      ? `${endDate}T23:59:59`
      : endTime
      ? `${endDate}T${endTime}:00`
      : undefined;

    startTransition(async () => {
      try {
        await createEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          startDateTime,
          endDateTime,
          isAllDay,
          location: location.trim() || undefined,
          meetingLink: meetingLink.trim() || undefined,
          remindMinutesBefore: remindMinutes,
        });

        toast.success("Event scheduled");
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setLocation("");
        setMeetingLink("");
        loadData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to schedule event");
      }
    });
  };

  const handleToggle = async (event: IEvent) => {
    try {
      setEvents((prev) =>
        prev.map((e) =>
          e._id === event._id ? { ...e, isCompleted: !e.isCompleted } : e
        )
      );
      await toggleEventComplete(event._id);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      setEvents((prev) => prev.filter((e) => e._id !== id));
      await deleteEvent(id);
      toast.success("Event deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete event");
      loadData();
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.description?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule & Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Client meetings, project deadlines, calendar events, and reminders.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-1.5 shadow-sm shadow-primary/25 h-9"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Schedule Event</span>
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTimeFilter("upcoming")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              timeFilter === "upcoming"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTimeFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              timeFilter === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            All Events
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px] rounded-lg">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="client_call">Client Call</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule..."
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No events scheduled</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Your agenda is open. Click below to schedule a meeting or deadline.
            </p>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-xl text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Schedule Event
            </Button>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const typeInfo = typeConfig[event.type] || typeConfig.meeting;
            const startDateObj = new Date(event.startDateTime);

            return (
              <div
                key={event._id}
                className={cn(
                  "p-4 rounded-xl border border-border/70 bg-card/80 transition-all flex items-start justify-between gap-4 group hover:border-primary/40",
                  event.isCompleted && "opacity-60 bg-secondary/30"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(event)}
                    className="mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {event.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={cn(
                          "text-sm font-semibold text-foreground break-words",
                          event.isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {event.title}
                      </h4>

                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0",
                          typeInfo.color,
                          typeInfo.bg,
                          typeInfo.border
                        )}
                      >
                        {typeInfo.label}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}

                    {/* Timeline, Location, Meeting Link */}
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                        <span>{format(startDateObj, "EEE, MMM d, yyyy")}</span>
                        {!event.isAllDay && (
                          <span className="text-muted-foreground font-normal">
                            at {format(startDateObj, "h:mm a")}
                          </span>
                        )}
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.location}</span>
                        </span>
                      )}

                      {event.remindMinutesBefore && event.remindMinutesBefore > 0 ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Bell className="w-3 h-3 text-amber-500" />
                          <span>{event.remindMinutesBefore}m before</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event._id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
            <DialogDescription className="text-xs">
              Add a meeting, call, deadline or personal reminder.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Event Title *</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sprint review call with client"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="client_call">Client Call</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="allday"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(!!checked)}
              />
              <label htmlFor="allday" className="text-xs font-medium cursor-pointer">
                All-day Event
              </label>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Time (Optional)</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Meeting Link (Zoom / Google Meet URL)</Label>
              <Input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Location (Optional)</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Office, Cafe, Remote"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reminder Notice</Label>
                <Select
                  value={String(remindMinutes)}
                  onValueChange={(v) => setRemindMinutes(Number(v))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">At time of event</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agenda, attendee names, discussion topics..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending ? "Scheduling..." : "Save Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
