/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Zap, 
  Image as ImageIcon, 
  Video, 
  Settings, 
  History, 
  Send, 
  Sparkles, 
  Layers, 
  ArrowRight,
  Maximize2,
  Download,
  Trash2,
  Plus,
  ChevronRight,
  BrainCircuit,
  Wand2,
  Terminal,
  SlidersHorizontal,
  Database,
  Activity,
  BarChart3,
  Monitor,
  HardDrive,
  Cpu as CpuIcon,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  Puzzle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Globe,
  Box,
  Library,
  GitBranch,
  CheckCircle2,
  Clock,
  Play,
  User,
  Map as MapIcon,
  Search,
  GripVertical,
  Loader2
} from "lucide-react";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent } from '@dnd-kit/core';

import { Button, buttonVariants } from "@/components/ui/button";

function DraggableResult({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div {...listeners} {...attributes} className="absolute -left-3 top-4 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 bg-background border rounded shadow-sm z-20 transition-opacity">
        <GripVertical size={14} className="text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

function DroppableRoom({ id, room, concept, memories, isDragging }: { id: string, room: string, concept: string, memories: number, isDragging: boolean, key?: React.Key }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border transition-all cursor-pointer",
        isOver ? "border-amber-500 bg-amber-500/20 scale-[1.02] shadow-lg" : "bg-muted/20 border-border/50 hover:border-amber-500/50",
        isDragging && !isOver ? "border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20 animate-pulse" : ""
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded flex items-center justify-center transition-colors",
            isOver ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-500"
          )}>
            <MapIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-bold">{room}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{concept}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-xs font-mono font-bold", isOver ? "text-white" : "text-amber-500")}>{memories}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Nodes</p>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { 
  generateText, 
  generateImage, 
  judgeAndRoute, 
  selfEvolve,
  MODELS, 
  ModelType, 
  GenerationResult,
  getMockMetrics,
  getSystemStatus,
  MODEL_CATALOG,
  type CatalogModel
} from "./services/geminiService";

const PROMPT_CUES = [
  { label: "Refine", text: "Refine this text for clarity and professional tone: " },
  { label: "Summarize", text: "Summarize the following into 3 key bullet points: " },
  { label: "Code", text: "Write a React component for: " },
  { label: "Creative", text: "Write a sci-fi short story about: " },
  { label: "Image", text: "A cinematic, high-detail digital art piece of: " },
];

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType | "auto">("auto");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageSize, setImageSize] = useState("1K");
  const [routingReason, setRoutingReason] = useState<string | null>(null);
  const [isParallel, setIsParallel] = useState(false);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [showFineTune, setShowFineTune] = useState(false);
  const [fineTuneConfig, setFineTuneConfig] = useState({
    baseModel: "gemini-3.1-pro-preview",
    epochs: 3,
    learningRate: 0.0001,
    batchSize: 4,
    datasetName: "customer_support_v1.jsonl"
  });
  const [activeTab, setActiveTab] = useState("chat");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [datasetPreview, setDatasetPreview] = useState([
    { prompt: "How do I reset my password?", completion: "To reset your password, go to settings and click 'Security'." },
    { prompt: "What is the return policy?", completion: "Our return policy allows returns within 30 days of purchase." },
    { prompt: "Can I upgrade my plan?", completion: "Yes, you can upgrade your plan at any time from the billing dashboard." },
  ]);
  const [systemStatus, setSystemStatus] = useState(getSystemStatus());
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [internetSearch, setInternetSearch] = useState(false);
  const [routines, setRoutines] = useState([
    { id: 1, name: "Daily Market Summary", trigger: "08:00 AM", active: true },
    { id: 2, name: "Code Quality Audit", trigger: "On Commit", active: false },
  ]);
  const [evolutionSuggestions, setEvolutionSuggestions] = useState([
    { id: 1, title: "Optimize Token Streaming", description: "Implement chunked processing for 15% lower perceived latency.", code: "const stream = await ai.streamText(...)" },
    { id: 2, title: "Add Voice Synthesis", description: "Integrate ElevenLabs for high-fidelity audio output.", code: "import { ElevenLabs } from 'elevenlabs-node'" },
  ]);
  const [memoryPalace, setMemoryPalace] = useState([
    { id: 1, room: "The Grand Foyer", concept: "Core Identity & Directives", memories: 12 },
    { id: 2, room: "The Library", concept: "Historical Context & Knowledge Base", memories: 450 },
  ]);
  const [isIdle, setIsIdle] = useState(false);
  const [idleTasks, setIdleTasks] = useState([
    { id: 1, task: "Quantizing Llama-3-8B weights", progress: 45, status: "active" },
    { id: 2, task: "Indexing local documentation", progress: 100, status: "completed" },
    { id: 3, task: "Pruning redundant memory nodes", progress: 12, status: "active" },
  ]);
  const [workflowRecommendations, setWorkflowRecommendations] = useState([
    { id: 1, title: "Automated PR Review", description: "I noticed you spend 2h/day on GitHub. I can automate initial code audits.", icon: <GitBranch size={16} /> },
    { id: 2, title: "Spatial Asset Pipeline", description: "You're generating many 3D models. Want me to set up an auto-export to Blender?", icon: <Box size={16} /> },
  ]);
  const [recommendedModels, setRecommendedModels] = useState([
    { id: "code-llama-34b", name: "CodeLlama 34B", reason: "Based on your frequent Python development sessions." },
    { id: "flux-1-schnell", name: "Flux.1 Schnell", reason: "To speed up your high-frequency image generation workflows." },
  ]);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (over && over.id.toString().startsWith('room-')) {
      const roomId = parseInt(over.id.toString().replace('room-', ''));
      const resultIdx = parseInt(active.id.toString().replace('result-', ''));
      
      setMemoryPalace(prev => prev.map(room => 
        room.id === roomId ? { ...room, memories: room.memories + 1 } : room
      ));
      
      toast.success("Categorized in Memory", { 
        description: `Result added to ${memoryPalace.find(r => r.id === roomId)?.room}` 
      });
    }
  };

  useEffect(() => {
    let idleTimer: any;
    const handleActivity = () => {
      if (isIdle) {
        setIsIdle(false);
        toast.info("System activity detected", { description: "Background optimization paused." });
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
        toast.success("System idle", { description: "Initiating routine optimization tasks..." });
      }, 10000); // 10 seconds for demo purposes
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    handleActivity();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      clearTimeout(idleTimer);
    };
  }, [isIdle]);

  useEffect(() => {
    const updateMetrics = async () => {
      const status = await getSystemStatus();
      setSystemStatus(status);
      setMetricsHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: status.cpu,
          gpu: status.gpu,
          memory: status.memory,
        };
        return [...prev.slice(-19), newPoint];
      });
    };

    const interval = setInterval(updateMetrics, 3000);
    updateMetrics();
    return () => clearInterval(interval);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setRoutingReason(null);
    
    try {
      let targetModel: ModelType;
      
      if (selectedModel === "auto") {
        const route = await judgeAndRoute(prompt);
        targetModel = route.model;
        setRoutingReason(route.reason);
        toast.info(`Routed to ${targetModel}`, { description: route.reason });
      } else {
        targetModel = selectedModel;
      }

      const modelInfo = MODELS.find(m => m.id === targetModel);
      
      if (isParallel && modelInfo?.type === "text") {
        // Parallel execution for text models
        const textModels: ModelType[] = ["gemini-3.1-pro-preview", "gemini-3-flash-preview"];
        const parallelPromises = textModels.map(async (m) => {
          const text = await generateText(prompt, m, internetSearch);
          return { 
            text, 
            model: m, 
            timestamp: Date.now(),
            metrics: getMockMetrics(),
            internetSearch
          };
        });
        const parallelResults = await Promise.all(parallelPromises);
        setResults(prev => [...prev, ...parallelResults]);
      } else if (modelInfo?.type === "image") {
        const imageUrl = await generateImage(prompt, { 
          aspectRatio, 
          size: imageSize, 
          model: targetModel 
        });
        const result = { 
          imageUrl, 
          model: targetModel, 
          timestamp: Date.now(),
          metrics: getMockMetrics(),
          internetSearch
        };
        setResults(prev => [...prev, result]);
      } else if (modelInfo?.type === "video") {
        // Mock video for now as Veo takes time and might need specific setup
        toast.warning("Video generation initiated. This may take a few minutes.");
        const result = { 
          text: "Video generation request sent to Veo 3.1 Lite...", 
          model: targetModel, 
          timestamp: Date.now(),
          metrics: getMockMetrics(),
          internetSearch
        };
        setResults(prev => [...prev, result]);
      } else if (modelInfo?.type === "3d") {
        toast.info("Generating 3D spatial model...");
        const result = { 
          text: "3D Model Generation in progress. Spatial mesh being calculated...",
          model3dUrl: "https://example.com/mock-3d-model.glb",
          model: targetModel, 
          timestamp: Date.now(),
          metrics: getMockMetrics(),
          internetSearch
        };
        setResults(prev => [...prev, result]);
      } else {
        const text = await generateText(prompt, targetModel, internetSearch);
        const result = { 
          text, 
          model: targetModel, 
          timestamp: Date.now(),
          metrics: getMockMetrics(),
          internetSearch
        };
        setResults(prev => [...prev, result]);

        // Trigger Autonomous Evolution check
        if (results.length > 0 && results.length % 3 === 0) {
          const evolution = await selfEvolve([...results, result]);
          if (evolution && !evolutionSuggestions.find(s => s.id === evolution.id)) {
            setEvolutionSuggestions(prev => [evolution, ...prev]);
            toast.success("New Evolution Proposal", { 
              description: `The engine has suggested a new ${evolution.category} update: ${evolution.title}` 
            });
          }
        }
      }

      setPrompt("");
    } catch (error) {
      toast.error("Generation failed", { description: String(error) });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = (idx: number, type: "positive" | "negative") => {
    setResults(prev => prev.map((res, i) => i === idx ? { ...res, feedback: type } : res));
    toast.success("Feedback recorded", { description: `Thank you for your ${type} feedback!` });
  };

  const applyCue = (cue: string) => {
    setPrompt(cue + prompt);
  };

  return (
    <DndContext onDragStart={(e) => setActiveDragId(e.active.id.toString())} onDragEnd={handleDragEnd}>
      <TooltipProvider>
        <div className="flex h-screen bg-background overflow-hidden font-sans">
        <Toaster position="top-right" />

        <AnimatePresence>
          {activeDragId && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed right-6 top-24 bottom-24 w-80 z-50 glass-panel border-l shadow-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 border-b pb-4">
                <MapIcon size={20} className="text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold">Categorize in Memory</h3>
                  <p className="text-[10px] text-muted-foreground">Drop result into a chamber</p>
                </div>
              </div>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {memoryPalace.map(m => (
                    <DroppableRoom 
                      key={m.id} 
                      id={`room-${m.id}`} 
                      room={m.room} 
                      concept={m.concept} 
                      memories={m.memories} 
                      isDragging={!!activeDragId}
                    />
                  ))}
                </div>
              </ScrollArea>
              <div className="pt-4 border-t text-[9px] text-muted-foreground italic text-center">
                Milla Jovovich Protocol Active
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/30 flex flex-col hidden md:flex">
          <div className="p-6 flex items-center gap-2 border-bottom">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <BrainCircuit size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">OmniSandbox</h1>
          </div>
          
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-6">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">Orchestration</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-yellow-500" />
                      <span className="text-sm font-medium">Auto-Judge</span>
                    </div>
                    <Switch checked={selectedModel === "auto"} onCheckedChange={(val) => setSelectedModel(val ? "auto" : "gemini-3-flash-preview")} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-blue-500" />
                      <span className="text-sm font-medium">Parallel Mode</span>
                    </div>
                    <Switch checked={isParallel} onCheckedChange={setIsParallel} />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">Navigation</Label>
                <div className="space-y-1">
                  <Button 
                    variant={activeTab === "chat" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("chat")}
                  >
                    <BrainCircuit size={14} className="text-primary" />
                    Neural Chat
                  </Button>
                  <Button 
                    variant={activeTab === "monitoring" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("monitoring")}
                  >
                    <BarChart3 size={14} className="text-green-500" />
                    Analytics Hub
                  </Button>
                  <Button 
                    variant={activeTab === "system" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("system")}
                  >
                    <Monitor size={14} className="text-blue-500" />
                    System Integration
                  </Button>
                  <Button 
                    variant={activeTab === "catalog" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("catalog")}
                  >
                    <Library size={14} className="text-orange-500" />
                    Model Catalog
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">Specialized</Label>
                <div className="space-y-1">
                  <Button 
                    variant={activeTab === "3d" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("3d")}
                  >
                    <Box size={14} className="text-cyan-500" />
                    3D Forge
                  </Button>
                  <Button 
                    variant={activeTab === "evolution" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("evolution")}
                  >
                    <GitBranch size={14} className="text-pink-500" />
                    Self-Evolution
                  </Button>
                  <Button 
                    variant={activeTab === "memory" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setActiveTab("memory")}
                  >
                    <MapIcon size={14} className="text-amber-500" />
                    Memory Palace
                  </Button>
                  <Button 
                    variant={showFineTune ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2 text-xs font-medium h-9 px-2"
                    onClick={() => setShowFineTune(!showFineTune)}
                  >
                    <SlidersHorizontal size={14} className="text-purple-500" />
                    Fine-Tuning Studio
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">History</Label>
                <div className="space-y-1">
                  {results.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2">No sessions yet</p>
                  )}
                  {results.slice(-5).reverse().map((res, i) => (
                    <div key={i} className="p-2 rounded-md hover:bg-muted cursor-pointer text-xs truncate">
                      {res.text || "Image Generation"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/50">
            <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9">
              <Settings size={14} />
              Settings
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative grid-pattern">
          {/* Header */}
          <header className="h-16 border-b glass-panel flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as any)}>
                <SelectTrigger className="w-[200px] h-9 bg-background">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Judge (Recommended)</SelectItem>
                  <Separator className="my-1" />
                  {MODELS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {routingReason && (
                <Badge variant="secondary" className="font-mono text-[10px] py-1 px-2 animate-in fade-in slide-in-from-left-2">
                  ROUTED: {routingReason}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <History size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download size={18} />
              </Button>
            </div>
          </header>

          {/* Chat/Output Area */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="max-w-5xl mx-auto space-y-8 pb-32">
              {activeTab === "monitoring" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-muted/20 border-border/50">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <CpuIcon size={24} className="text-blue-500 mb-2" />
                        <span className="text-2xl font-bold font-mono">{systemStatus.cpu}%</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">CPU Load</span>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/20 border-border/50">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Zap size={24} className="text-yellow-500 mb-2" />
                        <span className="text-2xl font-bold font-mono">{systemStatus.gpu}%</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">GPU Compute</span>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/20 border-border/50">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <HardDrive size={24} className="text-green-500 mb-2" />
                        <span className="text-2xl font-bold font-mono">{systemStatus.memory}%</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">RAM Usage</span>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/20 border-border/50">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Gauge size={24} className="text-purple-500 mb-2" />
                        <span className="text-2xl font-bold font-mono">{systemStatus.activeModels}</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Active LLMs</span>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-border/50 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity size={16} className="text-primary" />
                        Real-time Performance Telemetry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metricsHistory}>
                          <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={[0, 100]} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                          <Area type="monotone" dataKey="gpu" stroke="#eab308" fillOpacity={1} fill="url(#colorGpu)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Model Latency Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {MODELS.slice(0, 4).map(m => (
                            <div key={m.id} className="space-y-1">
                              <div className="flex justify-between text-[10px] uppercase font-bold">
                                <span>{m.name}</span>
                                <span>{Math.floor(Math.random() * 500 + 100)}ms</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Token Throughput (T/s)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {MODELS.slice(0, 4).map(m => (
                            <div key={m.id} className="space-y-1">
                              <div className="flex justify-between text-[10px] uppercase font-bold">
                                <span>{m.name}</span>
                                <span>{Math.floor(Math.random() * 30 + 10)} T/s</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${Math.random() * 70 + 10}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === "system" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {activeTab === "system" && (
                    <div className="space-y-4">
                      <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader className="py-3">
                          <CardTitle className="text-xs flex items-center gap-2">
                            <Globe size={14} className="text-blue-500" />
                            Autonomous Internet Access
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-0 pb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground">Allow engine to fetch live research and data.</p>
                            <Switch checked={internetSearch} onCheckedChange={setInternetSearch} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-pink-500/20 bg-pink-500/5">
                        <CardHeader className="py-3">
                          <CardTitle className="text-xs flex items-center gap-2">
                            <BrainCircuit size={14} className="text-pink-500" />
                            Self-Evolution Protocol
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-0 pb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground">Enable autonomous feature generation and optimization.</p>
                            <Switch checked={true} />
                          </div>
                          <div className="p-2 rounded bg-pink-500/10 border border-pink-500/20">
                            <p className="text-[9px] font-mono text-pink-300">STATUS: ANALYZING USER PATTERNS...</p>
                            <p className="text-[9px] font-mono text-pink-300">NEXT EVOLUTION: T-MINUS 3 INTERACTIONS</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-green-500/20 bg-green-500/5">
                        <CardHeader className="py-3">
                          <CardTitle className="text-xs flex items-center gap-2">
                            <Zap size={14} className="text-green-500" />
                            Research & Efficiency Optimizer
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-0 pb-3 space-y-3">
                          <p className="text-[10px] text-muted-foreground">Self-engineering to reduce resource footprint while maintaining performance.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-background/50 border text-center">
                              <p className="text-[8px] text-muted-foreground uppercase">Quantization</p>
                              <p className="text-xs font-bold text-green-500">INT4 (Active)</p>
                            </div>
                            <div className="p-2 rounded bg-background/50 border text-center">
                              <p className="text-[8px] text-muted-foreground uppercase">Context Pruning</p>
                              <p className="text-xs font-bold text-green-500">-25% RAM</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground italic">
                            <CheckCircle2 size={10} className="text-green-500" />
                            Applied latest research on Sparse Attention mechanisms.
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {window.electronAPI && (
                    <Card className="border-blue-500/20 bg-blue-500/5">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Terminal size={16} className="text-blue-500" />
                          Local System Integration
                        </CardTitle>
                        <CardDescription>Execute commands directly on your Windows host.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="e.g., start notepad.exe or dir" 
                            className="h-9 text-xs font-mono"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const cmd = e.currentTarget.value;
                                e.currentTarget.value = '';
                                toast.info(`Executing: ${cmd}`);
                                const res = await window.electronAPI.runLocalCommand(cmd);
                                if (res.success) {
                                  toast.success("Command Executed", { description: res.output.slice(0, 100) });
                                } else {
                                  toast.error("Command Failed", { description: res.error });
                                }
                              }
                            }}
                          />
                          <Button size="sm" variant="secondary">Run</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg border bg-background/50 space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">CPU Temp</p>
                            <p className="text-xl font-mono font-bold text-orange-500">{systemStatus.temp || '--'}Â°C</p>
                          </div>
                          <div className="p-3 rounded-lg border bg-background/50 space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Host OS</p>
                            <p className="text-xs font-medium">Windows 11 (Local)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive size={20} className="text-blue-500" />
                        On-Device Model Management
                      </CardTitle>
                      <CardDescription>Manage local GGUF, LoRA, and TensorRT optimized models.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {systemStatus.onDeviceModels.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${m.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
                              <div>
                                <p className="text-sm font-medium">{m.name}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-[9px] py-0">{m.type}</Badge>
                                  <Badge variant="outline" className="text-[9px] py-0">{m.vram}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant={m.status === 'running' ? 'destructive' : 'outline'} className="h-8 text-xs">
                                {m.status === 'running' ? 'Stop' : 'Launch'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Settings size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed gap-2">
                          <Plus size={16} />
                          Import Local Model
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap size={16} className="text-primary" />
                          Proactive Workflow Aids
                        </CardTitle>
                        <CardDescription>Strategies based on your PC usage patterns.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {workflowRecommendations.map(w => (
                          <div key={w.id} className="p-3 rounded border bg-background/50 space-y-2 group hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="text-primary">{w.icon}</div>
                              <span className="text-xs font-bold">{w.title}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{w.description}</p>
                            <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full group-hover:bg-primary group-hover:text-white">Implement Strategy</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-orange-500/20 bg-orange-500/5">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Library size={16} className="text-orange-500" />
                          Recommended for Download
                        </CardTitle>
                        <CardDescription>Models that will aid your specific workflows.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {recommendedModels.map(m => (
                          <div key={m.id} className="p-3 rounded border bg-background/50 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold">{m.name}</span>
                              <Button size="sm" variant="outline" className="h-6 text-[9px] px-2">View in Catalog</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">"{m.reason}"</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Puzzle size={16} className="text-purple-500" />
                          AI Plugins & Extensions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded border bg-muted/10">
                          <span className="text-xs font-medium">VS Code Integration</span>
                          <Switch checked />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded border bg-muted/10">
                          <span className="text-xs font-medium">System-wide OCR</span>
                          <Switch checked />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded border bg-muted/10">
                          <span className="text-xs font-medium">Browser Copilot</span>
                          <Switch />
                        </div>
                        <Button variant="link" className="text-[10px] h-auto p-0 text-muted-foreground">Manage all 12 plugins <ChevronRight size={10} /></Button>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock size={16} className="text-orange-500" />
                          Automatic Routines
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {routines.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-2 rounded border bg-muted/10">
                            <div>
                              <p className="text-xs font-medium">{r.name}</p>
                              <p className="text-[9px] text-muted-foreground">{r.trigger}</p>
                            </div>
                            <Switch checked={r.active} />
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full h-8 text-[10px] gap-2">
                          <Plus size={12} />
                          Create New Routine
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === "catalog" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Model Catalog</h2>
                      <p className="text-xs text-muted-foreground">Download and manage state-of-the-art models for local inference.</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <RefreshCw size={14} />
                      Check for Updates
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MODEL_CATALOG.map(m => (
                      <Card key={m.id} className="border-border/50 relative overflow-hidden">
                        {m.newUpdate && (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] px-2 py-0.5 font-bold uppercase tracking-tighter">
                            New Version Available
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm">{m.name}</CardTitle>
                            <Badge variant="secondary" className="text-[9px]">{m.category}</Badge>
                          </div>
                          <CardDescription className="text-[11px] line-clamp-1">{m.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
                            <span>Version: {m.version}</span>
                            <span>Size: {m.size}</span>
                          </div>
                          <Button 
                            className="w-full h-8 text-xs gap-2" 
                            variant={m.isDownloaded ? "outline" : "default"}
                          >
                            {m.isDownloaded ? (
                              <>
                                <CheckCircle2 size={14} className="text-green-500" />
                                Downloaded
                              </>
                            ) : (
                              <>
                                <Download size={14} />
                                Download Model
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "3d" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-cyan-500/20 bg-cyan-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Box size={20} className="text-cyan-500" />
                        3D Forge Engine
                      </CardTitle>
                      <CardDescription>Generate high-fidelity spatial meshes from text or images.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed">
                          <ImageIcon size={24} className="text-muted-foreground" />
                          <span className="text-xs">Image to 3D</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed">
                          <Terminal size={24} className="text-muted-foreground" />
                          <span className="text-xs">Prompt to 3D</span>
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Recent Spatial Exports</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-square rounded-lg border bg-muted/20 flex items-center justify-center group relative cursor-pointer overflow-hidden">
                              <Box size={32} className="text-muted-foreground/20 group-hover:text-cyan-500/40 transition-colors" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Button size="sm" variant="ghost" className="text-[10px] h-7">View GLB</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "evolution" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <GitBranch size={20} className="text-pink-500" />
                        Self-Evolution Dashboard
                      </h2>
                      <p className="text-xs text-muted-foreground">The engine has analyzed its own performance and suggests the following improvements.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {evolutionSuggestions.map(s => (
                      <Card key={s.id} className="border-pink-500/20 bg-pink-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{s.title}</CardTitle>
                          <CardDescription className="text-[11px]">{s.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="bg-black/40 p-3 rounded font-mono text-[10px] text-pink-300 border border-pink-500/20">
                            {s.code}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-xs h-8"
                              onClick={async () => {
                                if (window.electronAPI) {
                                  const path = await window.electronAPI.saveLocalData(`evolution_${s.id}.json`, s);
                                  toast.success("Evolution Applied", { description: `Configuration saved to: ${path}` });
                                } else {
                                  toast.success("Evolution Applied (Simulated)");
                                }
                              }}
                            >
                              Approve & Update
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-8">Reject</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "memory" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapIcon size={20} className="text-amber-500" />
                        Memory Palace (Milla Jovovich Protocol)
                      </CardTitle>
                      <CardDescription>Structured spatial memory system for long-term context retention.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {memoryPalace.map(m => (
                          <DroppableRoom 
                            key={m.id} 
                            id={`room-${m.id}`} 
                            room={m.room} 
                            concept={m.concept} 
                            memories={m.memories} 
                            isDragging={!!activeDragId}
                          />
                        ))}
                      </div>
                      <Button variant="outline" className="w-full border-dashed gap-2 text-xs h-10">
                        <Plus size={14} />
                        Construct New Chamber
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "chat" && (
                <>
                  {showFineTune && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={20} className="text-purple-500" />
                          <CardTitle>Fine-Tuning Studio</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowFineTune(false)}>
                          <Plus size={18} className="rotate-45" />
                        </Button>
                      </div>
                      <CardDescription>Configure and launch specialized model training jobs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Base Model</Label>
                          <Select value={fineTuneConfig.baseModel} onValueChange={(v) => setFineTuneConfig({...fineTuneConfig, baseModel: v})}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro</SelectItem>
                              <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Dataset</Label>
                          <div className="flex gap-2">
                            <Input value={fineTuneConfig.datasetName} readOnly className="h-8 text-xs flex-1" />
                            <Button size="sm" variant="outline" className="h-8 px-2"><Database size={14} /></Button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Epochs ({fineTuneConfig.epochs})</Label>
                          <Slider 
                            value={[fineTuneConfig.epochs]} 
                            max={10} 
                            min={1} 
                            step={1} 
                            onValueChange={(vals) => setFineTuneConfig({...fineTuneConfig, epochs: vals[0]})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Batch Size ({fineTuneConfig.batchSize})</Label>
                          <Slider 
                            value={[fineTuneConfig.batchSize]} 
                            max={32} 
                            min={1} 
                            step={1} 
                            onValueChange={(vals) => setFineTuneConfig({...fineTuneConfig, batchSize: vals[0]})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Learning Rate</Label>
                          <Input 
                            type="number" 
                            step="0.0001" 
                            value={fineTuneConfig.learningRate}
                            onChange={(e) => setFineTuneConfig({...fineTuneConfig, learningRate: parseFloat(e.target.value)})}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Dataset Preview</Label>
                          <Badge variant="outline" className="text-[10px] h-4">3 Samples</Badge>
                        </div>
                        <div className="bg-black/40 rounded-lg border border-purple-500/10 overflow-hidden">
                          <div className="max-h-[120px] overflow-y-auto p-2 space-y-2">
                            {datasetPreview.map((item, i) => (
                              <div key={i} className="text-[10px] p-2 rounded bg-purple-500/5 border border-purple-500/5">
                                <p className="text-purple-400 font-bold mb-1">Q: {item.prompt}</p>
                                <p className="text-muted-foreground">A: {item.completion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isTraining && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" />
                              Training in progress...
                            </span>
                            <span>{trainingProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-purple-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${trainingProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                        disabled={isTraining}
                        onClick={async () => {
                          setIsTraining(true);
                          setTrainingProgress(0);
                          
                          if (window.electronAPI) {
                            await window.electronAPI.saveLocalData(`finetune_${Date.now()}.json`, fineTuneConfig);
                          }

                          // Simulate training progress
                          const interval = setInterval(() => {
                            setTrainingProgress(prev => {
                              if (prev >= 100) {
                                clearInterval(interval);
                                setIsTraining(false);
                                toast.success("Training Complete", { description: "Model weights have been updated and deployed." });
                                return 100;
                              }
                              return prev + 5;
                            });
                          }, 300);
                        }}
                      >
                        {isTraining ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Optimizing Weights...
                          </>
                        ) : (
                          <>
                            <Activity size={16} />
                            Launch Training Job
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {results.length === 0 && !showFineTune && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-2">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">OmniSandbox Engine</h2>
                  <p className="max-w-md text-sm">
                    Begin by entering a prompt. The engine will automatically judge the best model or run multiple in parallel for comprehensive results.
                  </p>
                </div>
              )}

                  <AnimatePresence mode="popLayout">
                    {results.map((res, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <DraggableResult id={`result-${idx}`}>
                          <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between border-b">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            {res.model}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(res.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Maximize2 size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 size={12} className="text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {res.text && (
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans leading-relaxed">
                            {res.text}
                          </div>
                        )}
                        {res.imageUrl && (
                          <div className="rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center min-h-[300px]">
                            <img 
                              src={res.imageUrl} 
                              alt="Generated output" 
                              className="max-w-full h-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {res.model3dUrl && (
                          <div className="rounded-lg overflow-hidden border bg-muted/20 flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-4">
                            <Box size={64} className="text-cyan-500/40" />
                            <div>
                              <p className="text-sm font-bold">Spatial Mesh Generated</p>
                              <p className="text-xs text-muted-foreground">GLB format ready for export or AR preview.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-2">
                                <Maximize2 size={14} />
                                Preview in 3D
                              </Button>
                              <Button size="sm" className="gap-2">
                                <Download size={14} />
                                Download GLB
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {res.metrics && (
                          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Latency</span>
                                <span className="text-xs font-mono font-bold text-blue-500">{res.metrics.responseTime}ms</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Throughput</span>
                                <span className="text-xs font-mono font-bold text-green-500">{res.metrics.tokensPerSec} T/s</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">GPU Load</span>
                                <span className="text-xs font-mono font-bold text-yellow-500">{res.metrics.usage.gpu}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground mr-2">Rate response:</span>
                              <Button 
                                variant={res.feedback === 'positive' ? 'default' : 'ghost'} 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleFeedback(idx, 'positive')}
                              >
                                <ThumbsUp size={14} />
                              </Button>
                              <Button 
                                variant={res.feedback === 'negative' ? 'destructive' : 'ghost'} 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleFeedback(idx, 'negative')}
                              >
                                <ThumbsDown size={14} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                        </Card>
                      </DraggableResult>
                    </motion.div>
                  ))}
                </AnimatePresence>

              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  Engine processing...
                </motion.div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 z-20">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Prompt Cues */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {PROMPT_CUES.map((cue, i) => (
                  <Button 
                    key={i} 
                    variant="secondary" 
                    size="sm" 
                    className="h-7 text-[10px] font-medium rounded-full bg-muted/50 hover:bg-muted border border-border/50"
                    onClick={() => applyCue(cue.text)}
                  >
                    <Plus size={10} className="mr-1" />
                    {cue.label}
                  </Button>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <div className="relative bg-card border-2 border-border/50 rounded-2xl shadow-xl overflow-hidden focus-within:border-primary/50 transition-all">
                  <div className="flex items-end p-2 gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Ask anything, generate images, or orchestrate models..."
                        className="min-h-[100px] max-h-[300px] border-0 focus-visible:ring-0 resize-none bg-transparent text-sm p-4"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 pb-2 pr-2">
                      <Button 
                        size="icon" 
                        className="rounded-xl h-12 w-12 shadow-lg"
                        disabled={isGenerating || !prompt.trim()}
                        onClick={handleGenerate}
                      >
                        {isGenerating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send size={20} />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Config Bar */}
                  <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="h-7 w-20 text-[10px] bg-background border-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASPECT_RATIOS.map(r => (
                              <SelectItem key={r} value={r} className="text-[10px]">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Size</Label>
                        <Select value={imageSize} onValueChange={setImageSize}>
                          <SelectTrigger className="h-7 w-20 text-[10px] bg-background border-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="512px" className="text-[10px]">512px</SelectItem>
                            <SelectItem value="1K" className="text-[10px]">1K (HD)</SelectItem>
                            <SelectItem value="2K" className="text-[10px]">2K (QHD)</SelectItem>
                            <SelectItem value="4K" className="text-[10px]">4K (UHD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger 
                          className={cn(
                            buttonVariants({ variant: internetSearch ? "secondary" : "ghost", size: "icon" }),
                            "h-7 w-7",
                            internetSearch ? 'text-blue-500' : 'text-muted-foreground'
                          )}
                          onClick={() => setInternetSearch(!internetSearch)}
                        >
                          <Globe size={14} />
                        </TooltipTrigger>
                        <TooltipContent>Internet Access {internetSearch ? 'ON' : 'OFF'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 text-muted-foreground")}>
                          <Wand2 size={14} />
                        </TooltipTrigger>
                        <TooltipContent>Enhance Prompt</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 text-muted-foreground")}>
                          <Terminal size={14} />
                        </TooltipTrigger>
                        <TooltipContent>View Raw Logs</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                OmniSandbox Engine v1.0 • Multi-modal Synergy Enabled • Gemini 3.1 Architecture
              </p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
    </DndContext>
  );
}
