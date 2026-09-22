"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  X,
  BookOpen,
  CreditCard,
  Laptop,
  Activity,
  Table as TableIcon,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import {
  getCustomModules,
  createCustomModule,
  deleteCustomModule,
  getCustomRecords,
  createCustomRecord,
  deleteCustomRecord,
} from "@/lib/actions/custom-module.actions";
import { ICustomField } from "@/types/habit";

interface ModuleWithCount {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  fields: ICustomField[];
  recordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RecordDoc {
  _id: string;
  moduleId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const STARTER_TEMPLATES = [
  {
    name: "Reading List",
    icon: "BookOpen",
    color: "#8b5cf6",
    fields: [
      { name: "Title", key: "title", type: "text" as const },
      { name: "Author", key: "author", type: "text" as const },
      { name: "Rating (1-5)", key: "rating", type: "number" as const },
      {
        name: "Status",
        key: "status",
        type: "select" as const,
        options: ["Want to Read", "Reading", "Finished", "Abandoned"],
      },
      { name: "Finished Date", key: "finished_date", type: "date" as const },
    ],
  },
  {
    name: "Software Subscriptions",
    icon: "CreditCard",
    color: "#06b6d4",
    fields: [
      { name: "Service Name", key: "service_name", type: "text" as const },
      { name: "Monthly Cost (৳)", key: "cost", type: "number" as const },
      {
        name: "Billing Cycle",
        key: "cycle",
        type: "select" as const,
        options: ["Monthly", "Quarterly", "Annual"],
      },
      { name: "Renewal Date", key: "renewal_date", type: "date" as const },
      { name: "Auto Renew", key: "auto_renew", type: "boolean" as const },
    ],
  },
  {
    name: "Hardware & Devices",
    icon: "Laptop",
    color: "#10b981",
    fields: [
      { name: "Device Name", key: "device_name", type: "text" as const },
      { name: "Serial Number", key: "serial_no", type: "text" as const },
      { name: "Purchase Price (৳)", key: "price", type: "number" as const },
      { name: "Purchase Date", key: "purchase_date", type: "date" as const },
      { name: "In Warranty", key: "in_warranty", type: "boolean" as const },
    ],
  },
];

export default function CustomModulesPage() {
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleWithCount | null>(null);

  // Records for active module
  const [records, setRecords] = useState<RecordDoc[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchRecordQuery, setSearchRecordQuery] = useState("");

  // Modals
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [createRecordOpen, setCreateRecordOpen] = useState(false);

  // New module builder form state
  const [modName, setModName] = useState("");
  const [modColor, setModColor] = useState("#3b82f6");
  const [modFields, setModFields] = useState<ICustomField[]>([
    { name: "Title", key: "title", type: "text" },
  ]);

  // Dynamic record form data state
  const [recordData, setRecordData] = useState<Record<string, unknown>>({});

  const [isPending, startTransition] = useTransition();

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomModules();
      setModules(data);
      if (data.length > 0 && !selectedModule) {
        setSelectedModule(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load custom modules");
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Load records when selected module changes
  const loadRecords = useCallback(async (modId: string) => {
    try {
      setRecordsLoading(true);
      const data = await getCustomRecords(modId);
      setRecords(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load module records");
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadRecords(selectedModule._id);
    } else {
      setRecords([]);
    }
  }, [selectedModule, loadRecords]);

  // Field management in module builder
  const handleAddField = () => {
    const nextIdx = modFields.length + 1;
    setModFields((prev) => [
      ...prev,
      { name: `Field ${nextIdx}`, key: `field_${nextIdx}`, type: "text" },
    ]);
  };

  const handleUpdateField = (
    index: number,
    key: keyof ICustomField,
    val: unknown
  ) => {
    setModFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      // Auto update slug key if name changes
      if (key === "name" && typeof val === "string") {
        copy[index].key = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^_|_$)/g, "");
      }
      return copy;
    });
  };

  const handleRemoveField = (index: number) => {
    if (modFields.length <= 1) {
      toast.error("Module must have at least one field");
      return;
    }
    setModFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Module Submit
  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName.trim()) {
      toast.error("Module name is required");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createCustomModule({
          name: modName.trim(),
          color: modColor,
          fields: modFields,
        });

        toast.success(`Module "${created.name}" created!`);
        setCreateModuleOpen(false);
        setModName("");
        setModFields([{ name: "Title", key: "title", type: "text" }]);
        await loadModules();
        setSelectedModule(created);
      } catch (err) {
        console.error(err);
        toast.error("Failed to create module");
      }
    });
  };

  // Create Module from Starter Template
  const handleCreateFromTemplate = async (tmpl: typeof STARTER_TEMPLATES[0]) => {
    try {
      const created = await createCustomModule({
        name: tmpl.name,
        color: tmpl.color,
        fields: tmpl.fields,
      });

      toast.success(`Template "${tmpl.name}" installed!`, { icon: "📦" });
      await loadModules();
      setSelectedModule(created);
    } catch (err) {
      console.error(err);
      toast.error("Failed to install template");
    }
  };

  // Delete Module
  const handleDeleteModule = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete module "${name}" and all its records? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteCustomModule(id);
      toast.success(`Module "${name}" deleted`);
      if (selectedModule?._id === id) {
        setSelectedModule(null);
      }
      loadModules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete module");
    }
  };

  // Record Creation
  const handleCreateRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    startTransition(async () => {
      try {
        await createCustomRecord({
          moduleId: selectedModule._id,
          data: recordData,
        });

        toast.success("Record added successfully");
        setCreateRecordOpen(false);
        setRecordData({});
        loadRecords(selectedModule._id);
        loadModules();
      } catch (err) {
        console.error(err);
        toast.error("Failed to save record");
      }
    });
  };

  // Delete Record
  const handleDeleteRecord = async (recId: string) => {
    if (!selectedModule) return;
    try {
      await deleteCustomRecord(recId);
      toast.success("Record deleted");
      loadRecords(selectedModule._id);
      loadModules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete record");
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (!searchRecordQuery.trim()) return true;
    const q = searchRecordQuery.toLowerCase();
    return Object.values(r.data).some((val) =>
      String(val).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Custom Modules</h1>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono">
                  Schema Engine
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Design custom tracking tables, databases, and micro-apps with dynamic typed fields.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCreateModuleOpen(true)}
              className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Build Module
            </Button>
          </div>
        </div>

        {/* Quick starter templates */}
        <div className="mt-5 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              1-Click Starter Blueprints:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STARTER_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => handleCreateFromTemplate(tmpl)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-all text-left group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tmpl.color }}
                  />
                  <span className="text-xs font-medium text-foreground truncate">
                    {tmpl.name}
                  </span>
                </div>
                <span className="text-[10px] text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Install <ChevronRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left module tabs, Right records table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Selector Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Modules ({modules.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateModuleOpen(true)}
              className="h-6 text-[10px] text-primary gap-1 px-1.5"
            >
              <Plus className="h-3 w-3" />
              New
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-border/40 bg-card/40 animate-pulse"
                />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-card/40 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-semibold">No modules built yet</p>
              <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                Create a schema or install a blueprint above.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateModuleOpen(true)}
                className="text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Build Custom Module
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => {
                const isSelected = selectedModule?._id === mod._id;
                return (
                  <div
                    key={mod._id}
                    onClick={() => setSelectedModule(mod)}
                    className={`relative rounded-xl border p-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-card border-primary shadow-sm"
                        : "bg-card/60 border-border/60 hover:bg-card/90 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: mod.color || "#3b82f6" }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold truncate text-foreground">
                          {mod.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {mod.fields.length} fields • {mod.recordCount} records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(mod._id, mod.name);
                        }}
                        title="Delete module"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Module Content & Records View (8 cols) */}
        <div className="lg:col-span-8">
          {selectedModule ? (
            <div className="space-y-4">
              {/* Active Module Header */}
              <div className="rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: selectedModule.color || "#3b82f6" }}
                    />
                    <h3 className="text-base font-bold text-foreground">
                      {selectedModule.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {records.length} records
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedModule.fields.map((f) => (
                      <span
                        key={f.key}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground font-mono"
                      >
                        {f.name} <span className="opacity-60">({f.type})</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setRecordData({});
                      setCreateRecordOpen(true);
                    }}
                    className="text-xs bg-primary text-primary-foreground gap-1 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Row
                  </Button>
                </div>
              </div>

              {/* Records Filter / Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchRecordQuery}
                    onChange={(e) => setSearchRecordQuery(e.target.value)}
                    placeholder={`Filter in ${selectedModule.name}...`}
                    className="pl-8 text-xs h-9 bg-card/60 border-border/60"
                  />
                </div>
              </div>

              {/* Records Table */}
              <div className="rounded-2xl border border-border/80 bg-card/90 overflow-hidden shadow-sm">
                {recordsLoading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Loading records...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-10 text-center">
                    <TableIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">No records stored</p>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                      Add your first data row to this module.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRecordData({});
                        setCreateRecordOpen(true);
                      }}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Row
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-secondary/40">
                        <TableRow>
                          {selectedModule.fields.map((f) => (
                            <TableHead
                              key={f.key}
                              className="text-xs font-semibold text-foreground uppercase tracking-wider"
                            >
                              {f.name}
                            </TableHead>
                          ))}
                          <TableHead className="text-right text-xs font-semibold text-foreground">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((rec) => (
                          <TableRow key={rec._id} className="hover:bg-secondary/20">
                            {selectedModule.fields.map((f) => {
                              const val = rec.data[f.key];
                              return (
                                <TableCell key={f.key} className="text-xs">
                                  {f.type === "boolean" ? (
                                    val ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                                      >
                                        Yes
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]"
                                      >
                                        No
                                      </Badge>
                                    )
                                  ) : f.type === "date" && val ? (
                                    <span className="font-mono text-[11px]">
                                      {String(val)}
                                    </span>
                                  ) : (
                                    <span>{val !== undefined && val !== null ? String(val) : "—"}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteRecord(rec._id)}
                                title="Delete row"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border text-center">
              <Boxes className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
              <h3 className="text-sm font-semibold">Select a module</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Choose a module from the left or create a new custom schema to view and add records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Module Builder Modal */}
      <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Build Custom Module
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the name, accent color, and columns for your database module.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateModule} className="space-y-4 py-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Module Name *</Label>
                <Input
                  placeholder="e.g. Server Inventory, Client Contacts"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Color Accent</Label>
                <div className="flex items-center gap-1.5 h-9">
                  <input
                    type="color"
                    value={modColor}
                    onChange={(e) => setModColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {modColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Field Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Schema Fields</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddField}
                  className="h-6 text-[10px] text-primary gap-1 px-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {modFields.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/60 bg-secondary/20 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Field name (e.g. Serial Number)"
                          value={f.name}
                          onChange={(e) =>
                            handleUpdateField(idx, "name", e.target.value)
                          }
                          className="text-xs h-8"
                          required
                        />
                      </div>

                      <div className="w-32">
                        <Select
                          value={f.type}
                          onValueChange={(val) =>
                            handleUpdateField(
                              idx,
                              "type",
                              val as ICustomField["type"]
                            )
                          }
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveField(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Options if select */}
                    {f.type === "select" && (
                      <Input
                        placeholder="Comma-separated options (e.g. High, Medium, Low)"
                        value={f.options?.join(", ") || ""}
                        onChange={(e) =>
                          handleUpdateField(
                            idx,
                            "options",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                        className="text-[11px] h-7 bg-card"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModuleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                {isPending ? "Creating..." : "Save Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dynamic Record Creation Modal */}
      <Dialog open={createRecordOpen} onOpenChange={setCreateRecordOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add to {selectedModule?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Fill in the dynamic fields defined in this module.
            </DialogDescription>
          </DialogHeader>

          {selectedModule && (
            <form onSubmit={handleCreateRecordSubmit} className="space-y-3 py-1">
              {selectedModule.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.name}</Label>

                  {field.type === "text" && (
                    <Input
                      value={(recordData[field.key] as string) || ""}
                      onChange={(e) =>
                        setRecordData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="text-xs"
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      value={(recordData[field.key] as number) || ""}
                      onChange={(e) =>
                        setRecordData((prev) => ({
                          ...prev,
                          [field.key]: Number(e.target.value),
                        }))
                      }
                      className="text-xs"
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={(recordData[field.key] as string) || ""}
                      onChange={(e) =>
                        setRecordData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="text-xs"
                    />
                  )}

                  {field.type === "boolean" && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id={`bool-${field.key}`}
                        checked={!!recordData[field.key]}
                        onCheckedChange={(checked) =>
                          setRecordData((prev) => ({
                            ...prev,
                            [field.key]: !!checked,
                          }))
                        }
                      />
                      <label
                        htmlFor={`bool-${field.key}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        Enable / Mark Active
                      </label>
                    </div>
                  )}

                  {field.type === "select" && (
                    <Select
                      value={(recordData[field.key] as string) || ""}
                      onValueChange={(val) =>
                        setRecordData((prev) => ({
                          ...prev,
                          [field.key]: val,
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreateRecordOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs bg-primary text-primary-foreground font-semibold"
                >
                  {isPending ? "Saving..." : "Save Record"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
