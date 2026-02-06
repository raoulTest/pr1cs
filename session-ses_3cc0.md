# Port access booking platform plan and questions

**Session ID:** ses_3cc098641ffeJQBvHquMVg1P18
**Created:** 2/6/2026, 6:18:36 PM
**Updated:** 2/6/2026, 7:50:34 PM

---

## User

The application aims to develop a centralized platform to regulate maritime port access by managing truck flows through a synchronized booking system and terminal capacity engine.

There a 3 main roles in the application: 
The port admins: responsible for global system configuration.
Terminal operators: in charge of capacity management, and booking validation.
Carriers: manage their own truck fleets, and submit booking requests.

The application follows a conversational interface pattern. There is a chat in the center of the app, similar to ChatGPT or Gemini, and it controls the totality of the system. It controls it through tool calls and embedded widgets in the conversation (using convex and vercel ai sdk).

Example: a carrier asks for a booking request, the chat interface answers with a widget containing different suggestions from the booking timing. Notice that those answers are contained within the chat.

We know that we can’t limit ourselves to the conversational interface. So, similarly to ChatGPT or others, there will be a sidebar menu where you can access the traditional dashboards for example : the list of containers with their statuses etc…

The application should be fully configured to adapt to the reality of the port. The port admins should define the terminals, their gates, and assign terminals to operators. 

The terminals are open 24/7, each time slot is equal to 1 hour. Terminal operators choose which slots are active and the capacity of each slot. For convenience, we could say that there is a way to define a default capacity for all the slots at once. The app should handle the bulk editing either for activation/desactivation of time slots and capacity settings.

Carriers should be able to create a fleet of trucks. Adding, modifying and removing trucks. 

Carriers are here to pick-up/drop-off containers. Containers are already seeded in the database and assigned to the carriers (we assume that they are from an external data source, they should then be seeded for demonstration purposes). A container is represented by an id, a type of container, nature of the operation being made on the container (pick-up or drop-off) if it’s a pick-up, we have when the container was ready to pick. If it’s a drop-off, the date of departure of the boat. You can drop-off empty containers. I may have forgotten some properties, don’t hesitate to suggest modifications or enhancements at any step of this plan.

Carriers can submit a booking request which will include the containers (some of those will be picked up, others will be dropped off). Notice that the whole point of the conversational system is to make it easier for the carriers to express their needs.

The booking requests follow a specific algorithm. It relies a lot on the conversational agent. When the carrier starts the booking process. The AI agent will start by gathering information about the containers that are not treated yet by the carrier, and the truck. The user selects some of them. The agent then, based on a set of information that we’ll talk about later, guides the carrier through choosing the date and the slot of the booking. The aim of this is to load balance requests between different slots and optimization pick-ups and drop-offs. You should notice that this is happening through the chat interface with bubbles helping the carrier device, we want to limit the necessity of typing. After conversation, once they agree, he calls a tool that will show a card with a validation / declinaison button (always in the chat interface). And it’s done.

You should know that we will implement a system that auto validates N% of the maximum slot capacity. N is defined by the port admin. That means that N% of the booking requests for a time slot are directly validated. The other (100-N)% are subject to manual validation by the terminal operator.

The terminal operator sees a list of requests for each time slot, which will be ordered by priority according to an algorithm we will discuss later. 

Whether the request was approved automatically or manually, a reference id for the booking and a QR code should be generated.

Real-time availability should be displayed to the operators (slots availability). You should know that when I am talking about fetching any type of real-time data, whenever it’s relevant, return it into a component embedded in the chat that has a button to maximize the size of the component and see more data. Our goal is to make access to data easier, without the overhead of menus and complex interfaces, not in the detriment of simplicity and usefulness. If a menu is better, it is better.

There should be notifications for booking events, capacity alerts. 

The idea is to turn into a tool call every query/mutation that can be turned into it (it has to be pertinent). If I ask about the availability of a slot of a day, the AI should give me a card containing the information. 

Every action (either through the conversational AI or manual actions) should be logged. 

—

Now we have to make an extremely detailed plan covering every functional aspect of the application. I want you to ask me as many questions as you need. I want the questions to be well-thought. Each time you have a doubt about something, don’t hesitate to ask, we’ll refine the plan along the way until I am satisfied. 

---

## Assistant (Plan · claude-opus-4.5 · 138.0s)

I'll start by exploring the codebase to understand the current project structure, then ask clarifying questions to build a comprehensive plan.

**Tool: task**

**Input:**
```json
{
  "description": "Explore codebase structure",
  "prompt": "Explore the codebase structure to understand the current project setup. I need to understand:\n\n1. What is the overall project structure (monorepo layout)?\n2. What frameworks/technologies are being used (React, Next.js, Expo, etc.)?\n3. Is there any existing Convex setup?\n4. Is there any existing Vercel AI SDK integration?\n5. What authentication system is in place?\n6. What UI component libraries are used?\n7. Are there any existing database schemas or models?\n\nBe thorough - check package.json files, tsconfig files, convex folders, and any existing app directories. Return a comprehensive summary of the project structure and tech stack.",
  "subagent_type": "explore"
}
```

**Output:**
```
Excellent! I now have a comprehensive understanding of the project. Let me provide you with a detailed summary:

---

## Comprehensive Project Structure and Tech Stack Summary

### 1. Overall Project Structure (Monorepo Layout)

This is a **Turborepo monorepo** named "microhack" with the following structure:

```
microhack/
├── apps/
│   ├── web/          # Frontend web application
│   └── native/       # Mobile application (Expo/React Native)
├── packages/
│   ├── backend/      # Convex backend functions, schema, and AI agent
│   ├── env/          # Shared environment variable management
│   └── config/       # Shared configuration (currently minimal)
├── turbo.json        # Turborepo configuration
├── package.json      # Root workspace configuration
└── bun.lock          # Package manager: Bun v1.3.5
```

**Workspaces:**
- `apps/*` - Application packages
- `packages/*` - Shared library packages

---

### 2. Frameworks/Technologies

#### Web App (`apps/web/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | ^7.0.2 | Build tool |
| **TanStack Start** | ^1.141.1 | SSR framework with TanStack Router |
| **TanStack React Router** | ^1.141.1 | Client-side routing |
| **TanStack React Query** | ^5.80.6 | Data fetching/caching |
| **React** | 19.2.3 | UI framework |
| **TailwindCSS** | ^4.1.3 | Styling |
| **TypeScript** | ^5 | Type safety |

#### Native App (`apps/native/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | ^54.0.1 | React Native development |
| **React Native** | 0.81.4 | Mobile UI |
| **Expo Router** | ~6.0.0 | File-based routing |
| **React** | 19.1.0 | UI framework |
| **HeroUI Native** | ^1.0.0-beta.13 | Mobile UI component library |
| **TailwindCSS** | ^4.1.18 | Styling (via uniwind) |

---

### 3. Convex Setup

**YES - Extensive Convex setup exists** at `/packages/backend/convex/`

#### Configuration Files:
- `/packages/backend/convex/convex.config.ts` - Main Convex app config
- `/packages/backend/convex/auth.config.ts` - Auth configuration
- `/packages/backend/convex/tsconfig.json` - TypeScript config for Convex

#### Convex Components Used:
```typescript
// convex.config.ts
import betterAuth from "./betterAuth/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(betterAuth);  // Better Auth integration
app.use(agent);       // Convex Agent for AI
```

#### Backend Structure:
```
packages/backend/convex/
├── schema.ts                  # Main database schema
├── auth.ts                    # Authentication setup
├── auth.config.ts             # Auth providers config
├── http.ts                    # HTTP routes
├── crons.ts                   # Scheduled jobs
├── scheduled.ts               # Scheduled functions
├── ai/
│   ├── agent.ts               # AI agent definition
│   ├── chat.ts                # Chat actions (streaming)
│   ├── queries.ts             # AI-related queries
│   ├── registry.ts            # Tool registry
│   └── tools/                 # AI tools (bookings, terminals, config)
├── betterAuth/                # Better Auth Convex component
├── bookings/                  # Booking mutations/queries
├── carriers/                  # Carrier mutations/queries
├── gates/                     # Gate mutations/queries
├── terminals/                 # Terminal mutations/queries
├── trucks/                    # Truck mutations/queries
├── timeSlots/                 # Time slot mutations/queries
├── notifications/             # Notification mutations/queries
├── users/                     # User mutations/queries
├── config/                    # System config mutations/queries
└── lib/                       # Shared utilities (validators, permissions, capacity)
```

---

### 4. Vercel AI SDK Integration

**YES - Vercel AI SDK is integrated**

#### Dependencies:
- `"ai": "^5.0.128"` - Main Vercel AI SDK (in both web and backend)
- `"@ai-sdk/google": "^2.0.52"` - Google Gemini provider (in backend)
- `"@convex-dev/agent": "^0.3.2"` - Convex Agent SDK

#### AI Agent Implementation:
```typescript
// packages/backend/convex/ai/agent.ts
import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";

export const apcsAgent = new Agent(components.agent, {
  name: "APCS Assistant",
  languageModel: google("gemini-2.0-flash"),
  instructions: `You are the APCS (Advanced Port Container System) assistant...`,
  tools: ALL_TOOLS,
  maxSteps: 5,
});
```

#### Chat Features:
- Thread creation
- Streaming text responses (`streamText`)
- Non-streaming responses (`generateText`)
- Role-based tool access

#### Web App AI Components (`apps/web/src/components/ai-elements/`):
- 50+ AI-related UI components including:
  - `message.tsx` - Chat messages
  - `prompt-input.tsx` - Input with attachments
  - `artifact.tsx` - Rich content display
  - `code-block.tsx` - Code highlighting
  - `reasoning.tsx` - Chain-of-thought display
  - `tool.tsx` - Tool call visualization
  - And many more...

---

### 5. Authentication System

**Better Auth** is the authentication system with Convex integration.

#### Configuration:
```typescript
// packages/backend/convex/auth.ts
import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { convex } from "@convex-dev/better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins";

// Features:
- Email/password authentication (no email verification required)
- Expo plugin for React Native
- Convex database adapter
- Admin plugin for role management
- Access control with custom roles
```

#### User Roles (APCS-specific):
- `port_admin` - Full system access
- `terminal_operator` - Terminal management access
- `carrier` - Basic booking/truck access

#### Role-Based Access Control:
- Custom access control system with `createAccessControl`
- Tool-level permission checking for AI tools
- Per-role tool availability

#### Auth Providers in Apps:
- **Web**: `@convex-dev/better-auth/react` with `ConvexBetterAuthProvider`
- **Native**: Same provider with Expo-specific setup

---

### 6. UI Component Libraries

#### Web App:
| Library | Purpose |
|---------|---------|
| **shadcn/ui** | Primary UI components (33+ components in `/components/ui/`) |
| **Radix UI** | Headless components (via shadcn) |
| **Lucide React** | Icons |
| **cmdk** | Command palette |
| **Sonner** | Toast notifications |
| **class-variance-authority** | Variant styling |
| **tailwind-merge** | Class merging |
| **Motion** (framer-motion) | Animations |
| **Embla Carousel** | Carousels |
| **@xyflow/react** | Flow diagrams |
| **Streamdown** | Markdown streaming |

**shadcn/ui Components Available:**
- accordion, alert-dialog, alert, avatar, badge, button-group, button
- card, carousel, checkbox, collapsible, combobox, command, dialog
- dropdown-menu, field, hover-card, input-group, input, label
- popover, progress, scroll-area, select, separator, skeleton
- sonner, spinner, switch, tabs, textarea, tooltip

#### Native App:
| Library | Purpose |
|---------|---------|
| **HeroUI Native** | Mobile UI components |
| **@expo/vector-icons** | Icons |
| **@gorhom/bottom-sheet** | Bottom sheets |
| **React Navigation** | Navigation (bottom tabs, drawer) |
| **tailwind-variants** | Variant styling |

---

### 7. Database Schemas/Models

**Comprehensive Convex schema** at `/packages/backend/convex/schema.ts`:

#### Core Tables:

| Table | Purpose |
|-------|---------|
| `terminals` | Physical port terminals |
| `gates` | Entry points at terminals with capacity |
| `timeSlots` | Bookable time windows per gate |
| `terminalOperatorAssignments` | Links operators to terminals (M:M) |
| `carrierCompanies` | Organizations that own trucks |
| `carrierUsers` | Links users to carrier companies |
| `trucks` | Vehicles with type/class classification |
| `bookings` | Truck time slot reservations |
| `bookingHistory` | Audit trail for booking changes |
| `notifications` | Bilingual notifications (EN/FR) |
| `systemConfig` | Global system settings (singleton) |
| `userProfiles` | Extended user data beyond Better Auth |

#### Key Domain Validators:
```typescript
// User Roles
apcsRoleValidator: "port_admin" | "terminal_operator" | "carrier"

// Booking Lifecycle
bookingStatusValidator: "pending" | "confirmed" | "rejected" | "consumed" | "cancelled" | "expired"

// Truck Classification
truckClassValidator: "light" | "medium" | "heavy" | "super_heavy"
truckTypeValidator: "container" | "flatbed" | "tanker" | "refrigerated" | "bulk" | "general"

// Notification Types
notificationTypeValidator: "booking_created" | "booking_confirmed" | "booking_rejected" | etc.

// Languages
languageValidator: "en" | "fr"
```

#### Better Auth Tables:
Managed by the Better Auth component at `/packages/backend/convex/betterAuth/`:
- Generated schema with user/session/account tables
- Triggers for auto-creating userProfiles on user signup

---

### Summary

This is a **mature, full-stack logistics application** (Advanced Port Container System - APCS) with:

1. **Monorepo**: Turborepo with Bun package manager
2. **Web**: TanStack Start (Vite) + React 19 + TailwindCSS
3. **Mobile**: Expo 54 + React Native 0.81
4. **Backend**: Convex with extensive schema for port logistics
5. **AI**: Vercel AI SDK with Google Gemini, Convex Agent, role-based tools
6. **Auth**: Better Auth with custom APCS roles and access control
7. **UI**: shadcn/ui (web), HeroUI Native (mobile)
8. **Database**: Rich Convex schema with terminals, gates, bookings, trucks, carriers, notifications

<task_metadata>
session_id: ses_3cc09648dffejm5GaCqVrBikIT
</task_metadata>
```

**Tool: task**

**Input:**
```json
{
  "description": "Find existing chat/AI patterns",
  "prompt": "Search for any existing conversational UI patterns, AI chat implementations, or Vercel AI SDK usage in the codebase. Look for:\n\n1. Any chat components or message interfaces\n2. AI agent configurations or tool definitions\n3. Streaming response patterns\n4. Widget/embedded component patterns within messages\n5. Any existing tool call implementations\n\nSearch for keywords like: \"useChat\", \"streamText\", \"tool\", \"agent\", \"message\", \"conversation\", \"chat\"\n\nReturn what you find about existing patterns or confirm if none exist.",
  "subagent_type": "explore"
}
```

**Output:**
```
Now I have a comprehensive understanding of the codebase. Let me provide a summary of the findings:

---

## Summary: Existing Conversational UI Patterns, AI Chat Implementations, and Vercel AI SDK Usage

### 1. Chat Components and Message Interfaces

**Extensive AI Elements component library exists at:**
`/home/sones/projects/monorepo/apps/web/src/components/ai-elements/`

Key components include:

- **`message.tsx`** - Core message component with:
  - `Message`, `MessageContent`, `MessageActions`, `MessageResponse`
  - `MessageBranch` system for branching conversations
  - Uses `UIMessage` type from Vercel AI SDK
  - Integrates `Streamdown` for markdown rendering with plugins (code, math, mermaid, CJK)

- **`conversation.tsx`** - Conversation container with:
  - `Conversation`, `ConversationContent`, `ConversationEmptyState`
  - `ConversationScrollButton` - auto-scroll functionality using `use-stick-to-bottom`
  - `ConversationDownload` - export conversations as markdown
  - `ConversationMessage` interface: `{ role: "user" | "assistant" | "system" | "data" | "tool", content: string }`

- **`prompt-input.tsx`** - Comprehensive input system (~1338 lines):
  - `PromptInput`, `PromptInputTextarea`, `PromptInputSubmit`
  - `PromptInputProvider` - state management for input and attachments
  - File attachments with drag-drop, paste support
  - `PromptInputMessage` interface: `{ text: string, files: FileUIPart[] }`
  - Uses `ChatStatus` type from AI SDK

### 2. AI Agent Configurations and Tool Definitions

**Backend agent at:** `/home/sones/projects/monorepo/packages/backend/convex/ai/`

- **`agent.ts`** - Main AI agent using `@convex-dev/agent`:
  ```typescript
  export const apcsAgent = new Agent(components.agent, {
    name: "APCS Assistant",
    languageModel: google("gemini-2.0-flash"),
    instructions: `...`,
    tools: ALL_TOOLS,
    maxSteps: 5,
  });
  ```

- **`registry.ts`** - Central tool registry with role-based filtering:
  ```typescript
  export const ALL_TOOLS = {
    listMyBookings, getBookingDetails, listBookingsByTerminal,
    listBookingsByCarrier, listPendingBookings, listTerminals,
    getTerminalDetails, getAvailableSlots, getSystemConfig,
  }
  ```

- **`tools/types.ts`** - Role-based access control:
  ```typescript
  export const TOOL_PERMISSIONS: Record<ApcsRole, readonly string[]> = {
    carrier: [...],
    terminal_operator: [...],
    port_admin: [...],
  }
  ```

- **Tool implementations** (`tools/bookings.ts`, `tools/terminals.ts`, `tools/config.ts`):
  - Uses `createTool` from `@convex-dev/agent`
  - Zod schemas for argument validation
  - `checkToolAccess` for runtime permission checks
  - Returns structured data for frontend rendering

### 3. Streaming Response Patterns

**Backend streaming at:** `/home/sones/projects/monorepo/packages/backend/convex/ai/chat.ts`

```typescript
export const initiateStream = action({
  handler: async (ctx, args) => {
    await apcsAgent.streamText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      { prompt: fullPrompt },
      { saveStreamDeltas: true },
    );
  },
});
```

**Queries for real-time updates:** `/home/sones/projects/monorepo/packages/backend/convex/ai/queries.ts`
```typescript
export const listThreadMessages = query({
  handler: async (ctx, args) => {
    return await listMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
  },
});
```

### 4. Widget/Embedded Component Patterns Within Messages

**`tool.tsx`** - Tool invocation display:
- `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput`
- Supports `ToolUIPart` and `DynamicToolUIPart` from AI SDK
- Status indicators: pending, running, completed, error, approval states

**`confirmation.tsx`** - Tool approval workflow:
- `Confirmation`, `ConfirmationRequest`, `ConfirmationAccepted`, `ConfirmationRejected`, `ConfirmationActions`
- Uses `ToolUIPart` state for approval flow

**Additional AI element components (48 total):**
- `reasoning.tsx` - Chain of thought display
- `sources.tsx` - Source citations
- `code-block.tsx` - Code display
- `attachments.tsx` - File attachments
- `checkpoint.tsx` - Conversation checkpoints
- `artifact.tsx`, `canvas.tsx`, `sandbox.tsx` - Rich content display
- `agent.tsx`, `chain-of-thought.tsx`, `plan.tsx` - Agent workflow visualization

### 5. Existing Tool Call Implementations

**Tool creation pattern:**
```typescript
// From tools/bookings.ts
export const listMyBookings = createTool({
  description: "List the current user's bookings...",
  args: z.object({
    status: z.enum([...]).optional(),
    limit: z.number().optional(),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listMyBookings");
    if (denied) return denied;
    return await ctx.runQuery(internal.ai.internalQueries.listMyBookings, {...});
  },
});
```

### Key Patterns and Conventions

1. **Vercel AI SDK Integration:**
   - Uses `useChat` hook from `@ai-sdk/react`
   - `streamText`, `convertToModelMessages`, `UIMessage` from `ai` package
   - `ToolUIPart`, `DynamicToolUIPart`, `FileUIPart` types

2. **Backend Pattern:**
   - Convex-based with `@convex-dev/agent` for agent management
   - Google Gemini (`gemini-2.0-flash`) as the language model
   - Thread-based conversation management
   - Role-based access control at tool level

3. **Component Architecture:**
   - Composable, shadcn/ui-based components
   - Context providers for state management
   - Extends primitive HTML attributes for flexibility
   - Tailwind CSS for styling

4. **Reference Documentation:**
   - Located at `/home/sones/projects/monorepo/.agents/skills/ai-elements/`
   - Includes `SKILL.md` overview and `references/` folder with per-component docs

<task_metadata>
session_id: ses_3cc095717ffeLlW3yfr8zZAhAl
</task_metadata>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore Convex patterns used",
  "prompt": "Search for any existing Convex implementation patterns in the codebase. Look for:\n\n1. Schema definitions (schema.ts files)\n2. Query and mutation patterns\n3. Real-time subscription patterns\n4. Authentication integration with Convex\n5. File storage patterns\n6. Any existing agents or workflow implementations using @convex-dev/agent\n\nSearch thoroughly through any convex directories and related files. Return a summary of existing Convex patterns or confirm if it's a fresh setup.",
  "subagent_type": "explore"
}
```

**Output:**
```
I now have a comprehensive view of the Convex implementation. Let me provide you with a detailed summary:

---

## Summary of Existing Convex Implementation Patterns

This is **NOT a fresh setup** - it's a mature, well-structured Convex implementation for an **APCS (Advanced Port Container System)** truck booking platform. Here's what exists:

---

### 1. Schema Definitions (`/packages/backend/convex/schema.ts`)

**Location:** `/home/sones/projects/monorepo/packages/backend/convex/schema.ts`

**Key tables defined:**
- `terminals` - Port terminals with timezone, code
- `gates` - Entry points with capacity, allowed truck types/classes
- `timeSlots` - Bookable time windows per gate
- `terminalOperatorAssignments` - Many-to-many user-terminal assignments
- `carrierCompanies` - Organizations that own trucks
- `carrierUsers` - Links users to carrier companies
- `trucks` - Vehicles with type/class classification
- `bookings` - Full booking lifecycle with denormalized references
- `bookingHistory` - Audit trail for changes
- `notifications` - Bilingual (EN/FR) notification system
- `systemConfig` - Global settings singleton
- `userProfiles` - Extended user preferences

**Patterns:**
- Exported validators for reuse (`apcsRoleValidator`, `bookingStatusValidator`, etc.)
- Strategic indexes on frequently queried fields
- Denormalized fields for efficient queries (e.g., `terminalId` in bookings)

---

### 2. Query and Mutation Patterns

**Structure:** Organized by domain in `/convex/{domain}/queries.ts` and `/convex/{domain}/mutations.ts`:
- `bookings/` - Full CRUD + status transitions
- `carriers/` - Company management
- `gates/` - Gate CRUD
- `terminals/` - Terminal CRUD  
- `trucks/` - Vehicle management
- `timeSlots/` - Availability management
- `notifications/` - Notification CRUD
- `users/` - User queries
- `config/` - System config

**Query Patterns:**
```typescript
// Return type validators defined for type safety
const bookingListItemValidator = v.object({...});

// Role-based filtering
if (!isPortAdmin(user)) {
  if (!isCarrier(user) || user.carrierCompanyId !== args.carrierCompanyId) {
    return [];
  }
}

// Batch fetching with Promise.all
const [timeSlot, terminal, gate, truck, carrier] = await Promise.all([...]);

// Index-based efficient queries
ctx.db.query("bookings")
  .withIndex("by_carrier_and_status", (q) =>
    q.eq("carrierCompanyId", user.carrierCompanyId!).eq("status", args.status!)
  )
```

**Mutation Patterns:**
```typescript
// Input validation with validators
args: bookingInputValidator.fields

// Atomic capacity management
const reserved = await checkAndReserveCapacity(ctx, args.timeSlotId);

// History recording via internal mutations
await ctx.runMutation(internal.bookings.internal.recordHistory, {...});

// Status transition validation
if (!isValidStatusTransition(booking.status, "confirmed")) {...}
```

---

### 3. Real-Time Subscription Patterns

**Frontend Usage (`/apps/web/src/routes/convex-showcase.tsx`):**
```typescript
import { useQuery, useMutation } from "convex/react";

// Real-time queries
const myBookings = useQuery(api.bookings.queries.listMyBookings, {});
const bookingCounts = useQuery(api.bookings.queries.countByStatus, {});
const notifications = useQuery(api.notifications.queries.list, {});

// Conditional queries with "skip"
const slots = useQuery(
  api.timeSlots.queries.listByGateAndDate,
  selectedGateId ? { gateId: selectedGateId, date: selectedDate } : "skip"
);

// Mutations
const createBooking = useMutation(api.bookings.mutations.create);
const confirmBooking = useMutation(api.bookings.mutations.confirm);
```

**Auth components:**
```typescript
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
```

---

### 4. Authentication Integration

**Location:** `/packages/backend/convex/auth.ts`

**Integration:** Better Auth with Convex adapter via `@convex-dev/better-auth`

**Features:**
- Email/password authentication
- Expo mobile app support
- Admin plugin with role-based access control
- Three APCS roles: `port_admin`, `terminal_operator`, `carrier`
- User triggers for auto-creating `userProfiles`
- JWKS token rotation

**Pattern:**
```typescript
// Auth component creation
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    authFunctions,
    triggers: {
      user: {
        async onCreate(ctx, doc) {
          await ctx.db.insert("userProfiles", {...});
        },
      },
    },
  },
);

// Current user query
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
```

**HTTP Routes:** `/packages/backend/convex/http.ts`
```typescript
authComponent.registerRoutes(http, createAuth);
```

---

### 5. File Storage Patterns

**Status:** No Convex file storage (`ctx.storage`) is currently implemented in this codebase. The search found only:
- External blob storage URLs (Vercel Blob Storage)
- SKILL documentation files about Convex file storage patterns

---

### 6. AI Agent Implementation (`@convex-dev/agent`)

**Location:** `/packages/backend/convex/ai/`

**Files:**
- `agent.ts` - Main agent definition with Google Gemini
- `chat.ts` - Chat actions (createThread, initiateStream, generateResponse)
- `queries.ts` - Thread message listing
- `registry.ts` - Tool registry
- `tools/` - Domain-specific tools
- `internalQueries.ts` - Internal queries for agent tools

**Agent Definition:**
```typescript
import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";

export const apcsAgent = new Agent(components.agent, {
  name: "APCS Assistant",
  languageModel: google("gemini-2.0-flash"),
  instructions: `You are the APCS assistant...`,
  tools: ALL_TOOLS,
  maxSteps: 5,
});
```

**Tool Creation Pattern:**
```typescript
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";

export const listMyBookings = createTool({
  description: "List the current user's bookings...",
  args: z.object({
    status: z.enum([...]).optional(),
    limit: z.number().optional(),
  }),
  handler: async (ctx, args) => {
    const denied = await checkToolAccess(ctx, "listMyBookings");
    if (denied) return denied;
    return await ctx.runQuery(internal.ai.internalQueries.listMyBookings, {...});
  },
});
```

**Role-Based Tool Permissions:**
```typescript
export const TOOL_PERMISSIONS: Record<ApcsRole, readonly string[]> = {
  carrier: ["listMyBookings", "getBookingDetails", "listTerminals", ...],
  terminal_operator: [..., "listBookingsByTerminal", "listPendingBookings", ...],
  port_admin: [..., "listBookingsByCarrier", ...],
};
```

**Streaming Support:**
```typescript
// Stream text with real-time message updates
await apcsAgent.streamText(
  ctx,
  { threadId: args.threadId, userId: args.userId },
  { prompt: fullPrompt },
  { saveStreamDeltas: true },
);

// Frontend subscribes to messages
export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: v.any() },
  handler: async (ctx, args) => {
    return await listMessages(ctx, components.agent, {...});
  },
});
```

---

### 7. Scheduled Jobs (Crons)

**Location:** `/packages/backend/convex/crons.ts` and `/packages/backend/convex/scheduled.ts`

**Jobs:**
- **Booking expiration:** Every 15 minutes
- **24-hour reminders:** Every hour
- **2-hour reminders:** Every 30 minutes
- **Notification cleanup:** Daily at 2 AM UTC (30 days retention)
- **Booking history cleanup:** Weekly Sunday 3 AM UTC (90 days retention)
- **Capacity recalculation:** Daily at 4 AM UTC

**Pattern:**
```typescript
const crons = cronJobs();

crons.interval("expire old bookings", { minutes: 15 }, internal.scheduled.expireOldBookings, {});
crons.cron("cleanup old notifications", "0 2 * * *", internal.scheduled.cleanupOldNotifications, { daysToKeep: 30 });
```

---

### 8. Permission System

**Location:** `/packages/backend/convex/lib/permissions.ts`

**Features:**
- Authentication wrapper via Better Auth
- Role-based access control functions
- Terminal/Carrier/Truck/Booking permission checks
- Helper functions: `isPortAdmin()`, `isTerminalOperator()`, `isCarrier()`
- Functions: `canManageTerminal()`, `canViewBooking()`, `canModifyBookingStatus()`

---

### 9. Convex Component Configuration

**Location:** `/packages/backend/convex/convex.config.ts`

```typescript
import betterAuth from "./betterAuth/convex.config";
import agent from "@convex-dev/agent/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(agent);

export default app;
```

---

### Key Patterns Summary

| Pattern | Implementation |
|---------|---------------|
| Schema | Comprehensive with exported validators, strategic indexes |
| Queries | Return type validators, batch fetching, role-based filtering |
| Mutations | Input validation, atomic operations, history tracking |
| Real-time | `useQuery` with conditional "skip", `useMutation` |
| Auth | Better Auth integration with role-based access |
| File Storage | Not implemented yet |
| AI Agent | @convex-dev/agent with role-based tools, streaming |
| Crons | Background jobs for expiration, reminders, cleanup |
| Permissions | Comprehensive RBAC system |

<task_metadata>
session_id: ses_3cc094cc6ffec1olQKsDNt4toU
</task_metadata>
```

---

## Assistant (Plan · claude-opus-4.5 · 964.4s)

Excellent! I now have a comprehensive understanding of the existing codebase. This is a mature **APCS (Advanced Port Container System)** application with substantial infrastructure already in place:

- **Monorepo**: Turborepo with Bun (web + native apps)
- **Backend**: Convex with extensive schema, AI agent, Better Auth
- **AI**: Vercel AI SDK + @convex-dev/agent with Google Gemini
- **UI**: 48+ AI element components, shadcn/ui

Now let me ask clarifying questions to refine the plan:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "The current schema has bookings linked to trucks and time slots. However, your description mentions bookings should include multiple containers (some pick-up, some drop-off). Should a booking contain multiple containers, and how should the truck-container relationship work?",
      "header": "Booking-Container Model",
      "options": [
        {
          "label": "One booking = one truck + multiple containers",
          "description": "A single booking represents one truck trip with potentially multiple containers to pick-up/drop-off"
        },
        {
          "label": "One booking = one truck + one container",
          "description": "Each container requires a separate booking, even if transported by the same truck"
        },
        {
          "label": "One booking = multiple trucks + containers",
          "description": "A booking is a batch operation that can involve multiple trucks and containers"
        }
      ]
    },
    {
      "question": "How should the priority algorithm for terminal operators order pending booking requests? What factors should influence priority?",
      "header": "Priority Algorithm",
      "options": [
        {
          "label": "Urgency-based (boat departure dates)",
          "description": "Prioritize by proximity to boat departure for drop-offs, or how long containers have been waiting for pick-ups"
        },
        {
          "label": "FIFO (first come, first served)",
          "description": "Simple queue ordering by submission time"
        },
        {
          "label": "Multi-factor scoring",
          "description": "Combine urgency, carrier history/reputation, container value, and slot optimization"
        }
      ],
      "multiple": false
    },
    {
      "question": "For the AI-guided booking slot selection, what optimization criteria should the AI use when suggesting slots?",
      "header": "Slot Optimization Criteria",
      "options": [
        {
          "label": "Load balancing only",
          "description": "Spread bookings evenly across slots to avoid congestion"
        },
        {
          "label": "Load balancing + urgency",
          "description": "Balance load while prioritizing urgent containers (near departure dates)"
        },
        {
          "label": "Full optimization",
          "description": "Balance load, consider urgency, minimize carrier wait time, and optimize gate throughput"
        }
      ]
    },
    {
      "question": "How should the auto-validation threshold (N%) work when there are multiple pending requests for the same slot?",
      "header": "Auto-Validation Logic",
      "options": [
        {
          "label": "First N% auto-approved",
          "description": "First N% of capacity filled gets auto-approved, rest queued for manual review"
        },
        {
          "label": "Priority-based N%",
          "description": "Top N% by priority score get auto-approved, regardless of submission order"
        },
        {
          "label": "Configurable per terminal",
          "description": "Each terminal operator can choose their own auto-approval strategy"
        }
      ]
    },
    {
      "question": "What container properties should be tracked? You mentioned ID, type, operation type (pick-up/drop-off), and dates. Any additional properties?",
      "header": "Container Properties",
      "options": [
        {
          "label": "Basic properties only",
          "description": "ID, type, operation, ready date (pick-up) or departure date (drop-off), carrier assignment"
        },
        {
          "label": "Basic + weight/dimensions",
          "description": "Add weight class, dimensions (20ft/40ft/45ft), hazmat flag"
        },
        {
          "label": "Comprehensive tracking",
          "description": "Include location in terminal, seal number, temperature requirements, customs status, contents description"
        }
      ],
      "multiple": false
    },
    {
      "question": "How should notifications be delivered beyond the in-app notification system?",
      "header": "Notification Channels",
      "options": [
        {
          "label": "In-app only",
          "description": "Real-time notifications within the application only"
        },
        {
          "label": "In-app + Email",
          "description": "Add email notifications for critical events"
        },
        {
          "label": "In-app + Email + SMS",
          "description": "Full multi-channel notifications including SMS for urgent alerts"
        }
      ],
      "multiple": false
    },
    {
      "question": "Should the QR code for approved bookings contain the full booking data or just a reference ID that requires server lookup?",
      "header": "QR Code Content",
      "options": [
        {
          "label": "Reference ID only",
          "description": "QR contains just the booking reference; scanner must query server for details"
        },
        {
          "label": "Signed JWT with key data",
          "description": "QR contains cryptographically signed token with booking ID, truck, slot, and timestamp - works offline"
        },
        {
          "label": "Full encrypted payload",
          "description": "QR contains all booking details encrypted - fully offline capable"
        }
      ]
    },
    {
      "question": "What dashboard views are needed in the sidebar beyond the chat interface? This helps scope the traditional UI components.",
      "header": "Sidebar Dashboard Scope",
      "options": [
        {
          "label": "Minimal dashboards",
          "description": "Container list, booking history, basic settings - most actions via chat"
        },
        {
          "label": "Role-specific dashboards",
          "description": "Carriers: trucks/containers/bookings. Operators: slot management/approval queue. Admins: config/terminals/users"
        },
        {
          "label": "Comprehensive analytics",
          "description": "All above plus real-time analytics, reports, performance metrics, audit logs viewer"
        }
      ],
      "multiple": false
    },
    {
      "question": "How should the mobile (Expo) app differ from the web app? Same functionality or a subset?",
      "header": "Mobile App Scope",
      "options": [
        {
          "label": "Full feature parity",
          "description": "Mobile app has identical functionality to web"
        },
        {
          "label": "Carrier-focused mobile",
          "description": "Mobile primarily for carriers: booking, truck management, QR display, notifications"
        },
        {
          "label": "QR scanner + notifications only",
          "description": "Mobile is a lightweight companion for showing QR codes and receiving push notifications"
        }
      ]
    },
    {
      "question": "For the action logging system, what level of detail is needed?",
      "header": "Audit Log Detail",
      "options": [
        {
          "label": "Key events only",
          "description": "Log booking status changes, user role changes, system config changes"
        },
        {
          "label": "All mutations",
          "description": "Log every data mutation with before/after state, user, timestamp"
        },
        {
          "label": "Full audit trail",
          "description": "Log all mutations + all queries + AI tool calls + failed attempts + IP/device info"
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "The current schema has bookings linked to trucks and time slots. However, your description mentions bookings should include multiple containers (some pick-up, some drop-off). Should a booking contain multiple containers, and how should the truck-container relationship work?"="Ignore patterns, or things that were done that doesn't comply with our description. For this question, indeed, one booking may include multiple containers (some pick-up, some drop-off).", "How should the priority algorithm for terminal operators order pending booking requests? What factors should influence priority?"="Let it FIFO for now, we'll discuss it later. It's more complex.", "For the AI-guided booking slot selection, what optimization criteria should the AI use when suggesting slots?"="Full optimization", "How should the auto-validation threshold (N%) work when there are multiple pending requests for the same slot?"="First N% auto-approved", "What container properties should be tracked? You mentioned ID, type, operation type (pick-up/drop-off), and dates. Any additional properties?"="Weight class, dimensions only. Those should definitely not be used in prioritizing. Type can be frigorefic, etc...", "How should notifications be delivered beyond the in-app notification system?"="In-app + Email", "Should the QR code for approved bookings contain the full booking data or just a reference ID that requires server lookup?"="Reference ID only", "What dashboard views are needed in the sidebar beyond the chat interface? This helps scope the traditional UI components."="Comprehensive analytics", "How should the mobile (Expo) app differ from the web app? Same functionality or a subset?"="Ignore Expo app for now.", "For the action logging system, what level of detail is needed?"="Full audit trail". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · claude-opus-4.5 · 502.9s)

Thank you for the detailed answers. Let me ask a few more clarifying questions to complete the picture:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "header": "Container Size Standards",
      "options": [
        {
          "description": "20ft and 40ft containers only (standard sizes)",
          "label": "20ft / 40ft only"
        },
        {
          "description": "Include 40ft high-cube and 45ft options",
          "label": "20ft / 40ft / 40ft HC / 45ft"
        },
        {
          "description": "Allow custom/arbitrary dimensions for special cargo",
          "label": "Include non-standard sizes"
        }
      ],
      "question": "What container dimensions should the system support?"
    },
    {
      "header": "Container Types",
      "multiple": true,
      "options": [
        {
          "description": "General purpose box container",
          "label": "Dry"
        },
        {
          "description": "Temperature-controlled containers",
          "label": "Refrigerated (Reefer)"
        },
        {
          "description": "Open top for oversized cargo",
          "label": "Open Top"
        },
        {
          "description": "Without sidewalls for wide cargo",
          "label": "Flat Rack"
        },
        {
          "description": "For liquid bulk cargo",
          "label": "Tank"
        },
        {
          "description": "For gases or chemicals",
          "label": "Hazardous"
        }
      ],
      "question": "What container types should be supported?"
    },
    {
      "header": "Capacity Model",
      "options": [
        {
          "description": "Capacity is number of trucks (regardless of containers per truck)",
          "label": "Capacity = truck count"
        },
        {
          "description": "Capacity is number of containers that can be processed",
          "label": "Capacity = container count"
        },
        {
          "description": "Different operations (pick-up vs drop-off) have separate capacity pools",
          "label": "Separate pick-up/drop-off capacity"
        }
      ],
      "question": "How should slot capacity be measured - by number of trucks or number of containers? And should pick-up and drop-off operations have separate capacity pools?"
    },
    {
      "header": "Gate vs Terminal Capacity",
      "options": [
        {
          "description": "Capacity is defined per gate; terminal capacity is the sum of its gates",
          "label": "Gate-level capacity"
        },
        {
          "description": "Capacity is defined at terminal level; shared across all gates",
          "label": "Terminal-level capacity"
        },
        {
          "description": "Both: terminal has overall limit, gates have individual limits within that",
          "label": "Hierarchical (terminal + gate)"
        }
      ],
      "question": "Should capacity be managed at the gate level, terminal level, or both?"
    },
    {
      "header": "Bulk Editing Scope",
      "options": [
        {
          "description": "Bulk edit multiple time slots on the same day (e.g., set capacity for all morning slots)",
          "label": "Same day, multiple slots"
        },
        {
          "description": "Copy a day's template to multiple other days (e.g., apply Monday's config to all weekdays)",
          "label": "Copy day template"
        },
        {
          "description": "Define weekly recurring patterns that auto-apply to future weeks",
          "label": "Weekly recurring templates"
        },
        {
          "description": "All the above options",
          "label": "All options"
        }
      ],
      "question": "For bulk time slot editing, what operations should be supported?"
    },
    {
      "header": "Multi-Terminal Booking",
      "options": [
        {
          "description": "One booking request can only include containers from one terminal",
          "label": "Single terminal per booking"
        },
        {
          "description": "One booking can include containers from multiple terminals (requires multiple stops)",
          "label": "Multi-terminal allowed"
        }
      ],
      "question": "Can a single booking request span multiple terminals, or must each booking be for one terminal only?"
    },
    {
      "header": "Analytics Granularity",
      "options": [
        {
          "description": "Today, yesterday, this week, last 30 days",
          "label": "Fixed time periods"
        },
        {
          "description": "Custom date range picker with presets",
          "label": "Custom date ranges"
        },
        {
          "description": "Above + hourly/daily/weekly aggregation options + export to CSV/PDF",
          "label": "Full analytics suite"
        }
      ],
      "question": "What time granularity should the analytics dashboards support?"
    },
    {
      "header": "Booking Window Rules",
      "options": [
        {
          "description": "Carriers can book any available slot",
          "label": "No restrictions"
        },
        {
          "description": "Minimum hours in advance (e.g., must book 24h before slot)",
          "label": "Minimum advance booking"
        },
        {
          "description": "Min + max advance booking window (e.g., 24h to 7 days in advance)",
          "label": "Booking window (min + max)"
        }
      ],
      "question": "Should there be rules about how far in advance carriers can book?"
    },
    {
      "header": "Cancellation Policy",
      "options": [
        {
          "description": "Carriers can cancel anytime before the slot",
          "label": "Anytime"
        },
        {
          "description": "Must cancel X hours before slot start (configurable)",
          "label": "Minimum notice required"
        },
        {
          "description": "Grace period for free cancellation, then late cancellation flag",
          "label": "Tiered policy"
        }
      ],
      "question": "What cancellation rules should apply to confirmed bookings?"
    },
    {
      "header": "Booking Modification",
      "options": [
        {
          "description": "Carriers can modify pending bookings; confirmed bookings must be cancelled and re-booked",
          "label": "Pending only"
        },
        {
          "description": "Carriers can modify both pending and confirmed bookings (subject to availability)",
          "label": "Full modification"
        },
        {
          "description": "Modifications to confirmed bookings require operator approval",
          "label": "Modifications need approval"
        }
      ],
      "question": "Can carriers modify their booking after submission (change truck, containers, slot)?"
    }
  ]
}
```

**Output:**
```
User has answered your questions: "What container dimensions should the system support?"="20ft / 40ft / 40ft HC / 45ft", "What container types should be supported?"="Dry, Refrigerated (Reefer), Open Top, Flat Rack, Tank, Hazardous", "How should slot capacity be measured - by number of trucks or number of containers? And should pick-up and drop-off operations have separate capacity pools?"="Capacity = truck count", "Should capacity be managed at the gate level, terminal level, or both?"="Terminal-level, we just have to keep track of the gate we assigned the truck to go through", "For bulk time slot editing, what operations should be supported?"="All options", "Can a single booking request span multiple terminals, or must each booking be for one terminal only?"="Single terminal per booking", "What time granularity should the analytics dashboards support?"="Full analytics suite, using convex aggregate component.", "Should there be rules about how far in advance carriers can book?"="Configurable booking window (min + max in days)", "What cancellation rules should apply to confirmed bookings?"="Anytime", "Can carriers modify their booking after submission (change truck, containers, slot)?"="Can change truck only. In other cases he has to cancel and rebook again.". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · claude-opus-4.5 · 505.3s)

A few more questions to complete the system design:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "header": "Operator Assignment Model",
      "options": [
        {
          "description": "One operator per terminal (exclusive)",
          "label": "One-to-one"
        },
        {
          "description": "Multiple operators can be assigned to the same terminal (shared workload)",
          "label": "Many operators per terminal"
        },
        {
          "description": "One operator can manage multiple terminals",
          "label": "One operator, many terminals"
        },
        {
          "description": "Flexible: any operator can be assigned to any number of terminals",
          "label": "Many-to-many"
        }
      ],
      "question": "Can a terminal have multiple operators, and can an operator manage multiple terminals?"
    },
    {
      "header": "Truck Assignment",
      "options": [
        {
          "description": "Any truck from the carrier's fleet can be used for any booking",
          "label": "Flexible assignment"
        },
        {
          "description": "Trucks must be pre-assigned to specific terminals/gates based on type",
          "label": "Type-restricted by terminal"
        },
        {
          "description": "Some terminals/gates only accept certain truck classes (light/medium/heavy)",
          "label": "Class-restricted by terminal"
        }
      ],
      "question": "Can any truck from a carrier's fleet be assigned to any booking, or are there terminal/gate restrictions on truck types or classes?"
    },
    {
      "header": "Gate Assignment Timing",
      "options": [
        {
          "description": "Gate is assigned when the carrier submits the booking request",
          "label": "At booking creation"
        },
        {
          "description": "Gate is assigned when the booking is approved (manually or auto)",
          "label": "At approval time"
        },
        {
          "description": "Gate is assigned when the truck arrives at the terminal (real-time)",
          "label": "At arrival (dynamic)"
        }
      ],
      "question": "When is a specific gate assigned to a booking - at booking time, approval time, or dynamically at arrival?"
    },
    {
      "header": "Carrier Company Structure",
      "options": [
        {
          "description": "Each carrier user belongs to one company",
          "label": "One company per user"
        },
        {
          "description": "A user can belong to multiple carrier companies",
          "label": "Multiple companies per user"
        }
      ],
      "question": "Can a carrier user belong to multiple carrier companies, or just one?"
    },
    {
      "header": "Carrier Self-Registration",
      "options": [
        {
          "description": "Carriers self-register and are immediately active",
          "label": "Open registration"
        },
        {
          "description": "Carriers self-register but need port admin approval to activate",
          "label": "Registration + approval"
        },
        {
          "description": "Only port admins can create carrier accounts (no self-registration)",
          "label": "Admin-only creation"
        }
      ],
      "question": "How do new carrier companies and users get created in the system?"
    },
    {
      "header": "Empty Container Handling",
      "options": [
        {
          "description": "Empty drop-offs are separate from regular container drop-offs",
          "label": "Separate empty container tracking"
        },
        {
          "description": "Empty drop-offs are just containers without cargo (same data model)",
          "label": "Same as regular containers"
        }
      ],
      "question": "You mentioned dropping off empty containers. Should these be tracked differently from regular container drop-offs?"
    },
    {
      "header": "Multi-Language Support",
      "options": [
        {
          "description": "English only",
          "label": "English only"
        },
        {
          "description": "User can switch between English and French",
          "label": "EN + FR"
        },
        {
          "description": "Add Arabic support for French-speaking ports in North Africa",
          "label": "EN + FR + AR"
        }
      ],
      "question": "The notification system already has EN/FR. Should the entire UI support multiple languages?"
    },
    {
      "header": "AI Conversation History",
      "options": [
        {
          "description": "Each session starts fresh",
          "label": "No persistence"
        },
        {
          "description": "Conversations persist and can be resumed from sidebar",
          "label": "Persistent conversations"
        },
        {
          "description": "Above + conversations can be shared with colleagues in same company",
          "label": "Shared team conversations"
        }
      ],
      "question": "Should AI conversation history be preserved across sessions?"
    },
    {
      "header": "Booking Reference Format",
      "options": [
        {
          "description": "Auto-generated UUID",
          "label": "UUID"
        },
        {
          "description": "Human-readable format like BK-2024-001234",
          "label": "Sequential with prefix"
        },
        {
          "description": "Include terminal code: TER1-BK-001234",
          "label": "Terminal-prefixed"
        }
      ],
      "question": "What format should booking reference IDs follow?"
    },
    {
      "header": "Container Seeding Scope",
      "options": [
        {
          "description": "Small dataset (~50-100 containers) for basic testing",
          "label": "Small demo dataset"
        },
        {
          "description": "Realistic dataset (~500-1000 containers) with varied statuses",
          "label": "Medium realistic dataset"
        },
        {
          "description": "Large dataset (~5000+ containers) for performance testing",
          "label": "Large performance dataset"
        }
      ],
      "question": "For the seeded container data (simulating external source), what scale should we target?"
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Can a terminal have multiple operators, and can an operator manage multiple terminals?"="Many operators per terminal", "Can any truck from a carrier's fleet be assigned to any booking, or are there terminal/gate restrictions on truck types or classes?"="Flexible assignment", "When is a specific gate assigned to a booking - at booking time, approval time, or dynamically at arrival?"="At approval time", "Can a carrier user belong to multiple carrier companies, or just one?"="There is no principle of companies. A user has a fleet of trucks if he is a carrier.", "How do new carrier companies and users get created in the system?"="There is no carrier companies. Users are created by the admin.", "You mentioned dropping off empty containers. Should these be tracked differently from regular container drop-offs?"="Same as regular containers", "The notification system already has EN/FR. Should the entire UI support multiple languages?"="FR only.", "Should AI conversation history be preserved across sessions?"="They will be persisted using convex agent component through threads and messages.", "What format should booking reference IDs follow?"="Terminal-prefixed", "For the seeded container data (simulating external source), what scale should we target?"="Medium realistic dataset". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · claude-opus-4.5 · 347.8s)

Important clarifications noted! So there's no carrier company concept - carriers are individual users with their own truck fleets. A few final questions:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "header": "Container Assignment",
      "options": [
        {
          "description": "Each container is pre-assigned to one specific carrier in the seed data",
          "label": "Fixed carrier per container"
        },
        {
          "description": "Any carrier can book any unassigned container",
          "label": "Open assignment"
        },
        {
          "description": "Containers come with a designated carrier; that carrier must handle it",
          "label": "Mandatory designated carrier"
        }
      ],
      "question": "You mentioned containers are assigned to carriers. Since carriers are individual users (not companies), how is this assignment determined? Is it pre-defined in the external data source?"
    },
    {
      "header": "Truck Ownership",
      "options": [
        {
          "description": "Carriers own their trucks directly (user has trucks)",
          "label": "Direct ownership"
        },
        {
          "description": "Carriers can also use trucks from a shared pool or other carriers",
          "label": "Shared truck pool"
        }
      ],
      "question": "Since there are no carrier companies, trucks belong directly to individual carrier users. Can carriers share trucks, or does each truck belong to exactly one carrier?"
    },
    {
      "header": "AI Assistant Language",
      "options": [
        {
          "description": "Bilingual responses based on user preference",
          "label": "EN + FR (user choice)"
        },
        {
          "description": "AI responds in French only",
          "label": "French only"
        }
      ],
      "question": "Should the AI conversational assistant respond in French only (matching the UI), or should it be bilingual?"
    },
    {
      "header": "Email Notification Triggers",
      "multiple": true,
      "options": [
        {
          "description": "Booking submitted successfully",
          "label": "Booking created"
        },
        {
          "description": "Booking auto-approved or manually approved",
          "label": "Booking confirmed"
        },
        {
          "description": "Booking rejected by terminal operator",
          "label": "Booking rejected"
        },
        {
          "description": "Reminder X hours before slot time",
          "label": "Slot reminder"
        },
        {
          "description": "Slot approaches capacity limit",
          "label": "Capacity alert (operators)"
        },
        {
          "description": "Booking cancelled by carrier",
          "label": "Booking cancelled"
        }
      ],
      "question": "Which events should trigger email notifications?"
    },
    {
      "header": "Capacity Alert Threshold",
      "options": [
        {
          "description": "Alert at 80% capacity",
          "label": "80% threshold"
        },
        {
          "description": "Configurable threshold per terminal by operator",
          "label": "Configurable per terminal"
        },
        {
          "description": "Multiple thresholds (e.g., 70%, 90%, 100%)",
          "label": "Multiple thresholds"
        }
      ],
      "question": "At what capacity percentage should terminal operators receive alerts?"
    },
    {
      "header": "Slot Status Display",
      "options": [
        {
          "description": "Show only booked/total count per slot",
          "label": "Simple count"
        },
        {
          "description": "Show pending, confirmed, and available separately",
          "label": "Detailed breakdown"
        },
        {
          "description": "Above + visual color coding (green/yellow/red)",
          "label": "Visual + detailed"
        }
      ],
      "question": "How should real-time slot availability be displayed to operators?"
    },
    {
      "header": "Booking Consumption",
      "options": [
        {
          "description": "Manual: Operator or gate personnel mark the booking as used",
          "label": "Manual check-in"
        },
        {
          "description": "QR code scan at gate marks booking as consumed",
          "label": "QR scan check-in"
        },
        {
          "description": "Both options available",
          "label": "Manual + QR scan"
        }
      ],
      "question": "When a truck arrives and uses its booking, how is it marked as 'consumed'?"
    },
    {
      "header": "Expired/Missed Bookings",
      "options": [
        {
          "description": "Auto-expire after the slot time passes",
          "label": "Auto-expire"
        },
        {
          "description": "Grace period (e.g., 30 mins late allowed) then expire",
          "label": "Grace period + expire"
        },
        {
          "description": "Operator manually marks no-shows",
          "label": "Manual no-show"
        }
      ],
      "question": "What happens when a confirmed booking's time slot passes without the truck showing up?"
    },
    {
      "header": "Dashboard Chat Widget",
      "options": [
        {
          "description": "Chat is on a dedicated page, dashboards are separate pages",
          "label": "Separate pages"
        },
        {
          "description": "Chat panel can be opened as overlay from any dashboard page",
          "label": "Chat overlay on dashboards"
        },
        {
          "description": "Chat is always visible in a sidebar alongside dashboards",
          "label": "Persistent chat sidebar"
        }
      ],
      "question": "When users are on the traditional dashboard views (analytics, lists), should the chat be accessible?"
    },
    {
      "header": "Existing Schema Handling",
      "options": [
        {
          "description": "Refactor existing schema to match new requirements",
          "label": "Refactor existing"
        },
        {
          "description": "Start fresh with new schema design",
          "label": "New schema"
        },
        {
          "description": "Keep compatible parts, extend/modify as needed",
          "label": "Extend existing"
        }
      ],
      "question": "The existing codebase has a schema with carrierCompanies, carrierUsers, etc. Should we refactor to remove the company concept, or work around it?"
    }
  ]
}
```

**Output:**
```
User has answered your questions: "You mentioned containers are assigned to carriers. Since carriers are individual users (not companies), how is this assignment determined? Is it pre-defined in the external data source?"="Seeded containers. Each is pre-assigned to one specific carrier in the seed data. This is for demo purposes, because in reality we are getting from real APIs and storing them in db.", "Since there are no carrier companies, trucks belong directly to individual carrier users. Can carriers share trucks, or does each truck belong to exactly one carrier?"="Direct ownership", "Should the AI conversational assistant respond in French only (matching the UI), or should it be bilingual?"="French only", "Which events should trigger email notifications?"="Booking confirmed, Booking rejected, Booking created, Slot reminder, Capacity alert (operators), Booking cancelled", "At what capacity percentage should terminal operators receive alerts?"="Configurable per terminal", "How should real-time slot availability be displayed to operators?"="Visual + detailed", "When a truck arrives and uses its booking, how is it marked as 'consumed'?"="Double QR code scanning, at entry and exit.", "What happens when a confirmed booking's time slot passes without the truck showing up?"="Grace period + expire", "When users are on the traditional dashboard views (analytics, lists), should the chat be accessible?"="Closeable sidebar.", "The existing codebase has a schema with carrierCompanies, carrierUsers, etc. Should we refactor to remove the company concept, or work around it?"="Refactor existing". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · claude-opus-4.5 · 339.3s)

Excellent! I have all the information needed. Let me now create a comprehensive plan based on your requirements.

**Tool: task**

**Input:**
```json
{
  "description": "Design implementation approach",
  "prompt": "Based on the following comprehensive requirements for the APCS (Advanced Port Container System) maritime port booking application, design a detailed implementation plan.\n\n## Current State\n- Monorepo with Turborepo + Bun (apps/web using TanStack Start, packages/backend with Convex)\n- Existing Convex schema with terminals, gates, timeSlots, bookings, trucks, notifications, userProfiles\n- Existing AI agent using @convex-dev/agent with Google Gemini\n- 48+ AI element components for chat UI (message, tool, conversation, etc.)\n- Better Auth with roles: port_admin, terminal_operator, carrier\n- Existing carrierCompanies/carrierUsers tables that need to be refactored\n\n## Key Requirements Summary\n\n### User Roles\n1. **Port Admins**: Global system configuration, terminal/gate setup, user management, define auto-validation threshold (N%)\n2. **Terminal Operators**: Capacity management, time slot configuration, booking validation for their assigned terminals\n3. **Carriers**: Truck fleet management, container management, booking requests via AI chat\n\n### Data Model Changes Needed\n- **Remove carrierCompanies concept**: Trucks belong directly to carrier users\n- **Containers table**: id, type (Dry/Reefer/OpenTop/FlatRack/Tank/Hazardous), dimensions (20ft/40ft/40ftHC/45ft), weight class, operation type (pick-up/drop-off), readyDate (pick-up) or departureDate (drop-off), assignedCarrierId, isEmpty flag\n- **Bookings**: One booking = one truck + multiple containers, terminal-prefixed reference (TER1-BK-001234)\n- **Capacity**: Terminal-level (not gate), measured in truck count\n- **Gate assignment**: Assigned at approval time, not booking time\n\n### Conversational AI System\n- French-only AI assistant\n- Tool calls for all pertinent queries/mutations\n- Embedded widgets in chat for data display (with expand button)\n- AI guides carrier through slot selection using full optimization (load balancing + urgency + wait time minimization)\n- Booking flow: AI gathers containers → user selects → AI suggests optimal slots → user confirms → validation card in chat\n\n### Auto-Validation System\n- First N% of slot capacity auto-approved\n- Remaining (100-N)% require manual terminal operator approval\n- N is configurable by port admin\n\n### Time Slot System\n- 24/7 terminals, 1-hour slots\n- Operators define active slots and capacity per slot\n- Bulk editing: same day multiple slots, copy day template, weekly recurring patterns\n- Configurable booking window (min + max days in advance)\n\n### Booking Lifecycle\n- Status: pending → confirmed/rejected → consumed → expired\n- Carriers can only modify truck assignment; other changes require cancel + rebook\n- Cancellation allowed anytime\n- Grace period before auto-expiring no-shows\n- Double QR scan: entry + exit\n\n### Notifications\n- In-app + email for: booking created, confirmed, rejected, cancelled, slot reminder, capacity alerts\n- Configurable capacity alert thresholds per terminal\n\n### Dashboards (sidebar)\n- Comprehensive analytics with Convex aggregate component\n- Custom date ranges + presets\n- Hourly/daily/weekly aggregation\n- Export to CSV/PDF\n- Role-specific views\n- Closeable chat sidebar accessible from all dashboard pages\n\n### Audit Logging\n- Full audit trail: all mutations + queries + AI tool calls + failed attempts + IP/device info\n\n### QR Code\n- Contains reference ID only (server lookup required)\n- Generated on booking approval\n\n### Seeding\n- Medium realistic dataset (~500-1000 containers) for demo\n\nPlease design a phased implementation plan covering:\n1. Schema refactoring (remove carrier companies, add containers, update bookings)\n2. Core backend functions (queries, mutations, capacity engine)\n3. AI tools and conversational flows\n4. Time slot bulk editing system\n5. Auto-validation and booking approval workflows\n6. Notification system with email integration\n7. QR code generation and scanning\n8. Dashboard UI components\n9. Analytics with aggregations\n10. Audit logging system\n11. Seed data generation\n\nInclude specific file paths where changes should be made based on the existing structure.",
  "subagent_type": "general"
}
```

**Output:**
```
Now I have a comprehensive understanding of the existing codebase. Let me create a detailed implementation plan.

# APCS Maritime Port Booking System - Implementation Plan

## Executive Summary

This document outlines a phased implementation plan for transforming the existing APCS system based on the comprehensive requirements. The plan is organized into 11 phases, prioritized by dependencies and business value.

---

## Phase 1: Schema Refactoring (Foundation)

**Duration:** 3-5 days  
**Priority:** Critical - All subsequent phases depend on this

### 1.1 Remove Carrier Company Concept

**File:** `packages/backend/convex/schema.ts`

**Changes:**
- Remove `carrierCompanies` table
- Remove `carrierUsers` table
- Modify `trucks` table: remove `carrierCompanyId`, add `ownerId: v.string()` (Better Auth user ID)

```typescript
// REMOVE these tables:
// - carrierCompanies
// - carrierUsers

// MODIFY trucks table:
trucks: defineTable({
  ownerId: v.string(), // Better Auth user ID (carrier)
  licensePlate: v.string(),
  truckType: truckTypeValidator,
  truckClass: truckClassValidator,
  // ... rest remains same
})
  .index("by_owner", ["ownerId"])
  .index("by_owner_and_active", ["ownerId", "isActive"])
  // ... rest remains
```

### 1.2 Add Containers Table

**File:** `packages/backend/convex/schema.ts`

```typescript
// Add new validators
export const containerTypeValidator = v.union(
  v.literal("dry"),
  v.literal("reefer"),
  v.literal("open_top"),
  v.literal("flat_rack"),
  v.literal("tank"),
  v.literal("hazardous")
);

export const containerDimensionsValidator = v.union(
  v.literal("20ft"),
  v.literal("40ft"),
  v.literal("40ft_hc"),
  v.literal("45ft")
);

export const containerOperationValidator = v.union(
  v.literal("pick_up"),
  v.literal("drop_off")
);

export const containerWeightClassValidator = v.union(
  v.literal("light"),    // < 10t
  v.literal("medium"),   // 10-20t
  v.literal("heavy"),    // 20-30t
  v.literal("max")       // > 30t
);

// New table
containers: defineTable({
  ownerId: v.string(), // Carrier user ID
  containerNumber: v.string(), // ISO 6346 format (e.g., MSCU1234567)
  type: containerTypeValidator,
  dimensions: containerDimensionsValidator,
  weightClass: containerWeightClassValidator,
  operationType: containerOperationValidator,
  // For pick-up: when container will be ready
  readyDate: v.optional(v.number()),
  // For drop-off: expected departure date
  departureDate: v.optional(v.number()),
  isEmpty: v.boolean(),
  // Booking assignment (null if unassigned)
  bookingId: v.optional(v.id("bookings")),
  // Metadata
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
  .index("by_owner", ["ownerId"])
  .index("by_owner_and_active", ["ownerId", "isActive"])
  .index("by_container_number", ["containerNumber"])
  .index("by_booking", ["bookingId"])
  .index("by_operation_type", ["operationType"])
  .index("by_type", ["type"]),
```

### 1.3 Refactor Bookings Table

**File:** `packages/backend/convex/schema.ts`

```typescript
bookings: defineTable({
  // References (simplified)
  terminalId: v.id("terminals"),
  carrierId: v.string(), // Carrier user ID
  truckId: v.id("trucks"),
  // Gate assigned at approval (not at booking time)
  gateId: v.optional(v.id("gates")),
  timeSlotId: v.optional(v.id("timeSlots")), // Optional until gate assigned
  
  // Booking reference: TER1-BK-001234 (terminal-prefixed)
  bookingReference: v.string(),
  
  // Status
  status: bookingStatusValidator,
  
  // Auto-validation flag
  wasAutoValidated: v.boolean(),
  
  // Container IDs (1:N relationship)
  containerIds: v.array(v.id("containers")),
  
  // QR Code (generated on approval)
  qrCode: v.optional(v.string()),
  qrCodeStorageId: v.optional(v.id("_storage")),
  
  // Driver info
  driverName: v.optional(v.string()),
  driverPhone: v.optional(v.string()),
  driverIdNumber: v.optional(v.string()),
  
  // Slot preference (before gate assignment)
  preferredDate: v.string(), // YYYY-MM-DD
  preferredTimeStart: v.string(), // HH:mm
  preferredTimeEnd: v.string(), // HH:mm
  
  // Scan tracking
  entryScannedAt: v.optional(v.number()),
  exitScannedAt: v.optional(v.number()),
  entryScannedBy: v.optional(v.string()),
  exitScannedBy: v.optional(v.string()),
  
  // Timestamps
  bookedAt: v.number(),
  confirmedAt: v.optional(v.number()),
  rejectedAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  consumedAt: v.optional(v.number()),
  expiredAt: v.optional(v.number()),
  
  // Rejection/cancellation reason
  statusReason: v.optional(v.string()),
  
  // Who processed
  processedBy: v.optional(v.string()),
  createdBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_reference", ["bookingReference"])
  .index("by_terminal", ["terminalId"])
  .index("by_terminal_and_status", ["terminalId", "status"])
  .index("by_terminal_and_date", ["terminalId", "preferredDate"])
  .index("by_carrier", ["carrierId"])
  .index("by_carrier_and_status", ["carrierId", "status"])
  .index("by_truck", ["truckId"])
  .index("by_gate", ["gateId"])
  .index("by_time_slot", ["timeSlotId"])
  .index("by_status", ["status"])
  .index("by_created_by", ["createdBy"]),
```

### 1.4 Update Time Slots for Terminal-Level Capacity

**File:** `packages/backend/convex/schema.ts`

```typescript
// Time slots now belong to terminal, not gate
timeSlots: defineTable({
  terminalId: v.id("terminals"), // Changed from gateId
  date: v.string(), // YYYY-MM-DD
  startTime: v.string(), // HH:mm (24h format)
  endTime: v.string(), // HH:mm
  // Capacity is truck count at terminal level
  maxCapacity: v.number(),
  currentBookings: v.number(),
  // Auto-validation threshold (0-100%)
  autoValidationThreshold: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
  .index("by_terminal", ["terminalId"])
  .index("by_terminal_and_date", ["terminalId", "date"])
  .index("by_date", ["date"])
  .index("by_terminal_and_active", ["terminalId", "isActive"]),
```

### 1.5 Add System Configuration for Auto-Validation

**File:** `packages/backend/convex/schema.ts`

Update `systemConfig`:
```typescript
systemConfig: defineTable({
  // Existing fields...
  cancellationWindowHours: v.number(),
  maxAdvanceBookingDays: v.number(),
  minAdvanceBookingHours: v.number(),
  reminderHoursBefore: v.array(v.number()),
  
  // NEW: Auto-validation threshold (global default, can be overridden per terminal)
  defaultAutoValidationThreshold: v.number(), // 0-100 (percentage)
  
  // NEW: Grace period for no-shows (minutes after slot start)
  noShowGracePeriodMinutes: v.number(),
  
  // NEW: Booking window settings
  minBookingWindowHours: v.number(), // Minimum hours before slot
  maxBookingWindowDays: v.number(), // Maximum days in advance
  
  updatedAt: v.number(),
  updatedBy: v.string(),
}),
```

### 1.6 Add Audit Log Table

**File:** `packages/backend/convex/schema.ts`

```typescript
export const auditActionValidator = v.union(
  v.literal("query"),
  v.literal("mutation"),
  v.literal("ai_tool_call"),
  v.literal("login"),
  v.literal("logout"),
  v.literal("failed_auth"),
  v.literal("permission_denied")
);

auditLogs: defineTable({
  userId: v.optional(v.string()), // null for anonymous/failed auth
  action: auditActionValidator,
  resource: v.string(), // Function name or resource type
  resourceId: v.optional(v.string()), // Entity ID if applicable
  
  // Request details
  args: v.optional(v.string()), // JSON stringified (sanitized)
  result: v.optional(v.string()), // Success/failure/error message
  
  // Context
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  
  // AI-specific
  aiThreadId: v.optional(v.string()),
  aiToolName: v.optional(v.string()),
  
  // Timing
  timestamp: v.number(),
  durationMs: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_action", ["action"])
  .index("by_resource", ["resource"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_and_timestamp", ["userId", "timestamp"]),
```

### 1.7 Terminal Configuration Updates

**File:** `packages/backend/convex/schema.ts`

```typescript
terminals: defineTable({
  // Existing fields...
  name: v.string(),
  code: v.string(), // Used in booking reference prefix (TER1, TER2, etc.)
  address: v.optional(v.string()),
  timezone: v.string(),
  isActive: v.boolean(),
  
  // NEW: Terminal-specific settings
  autoValidationThreshold: v.optional(v.number()), // Overrides global if set
  capacityAlertThresholds: v.optional(v.array(v.number())), // e.g., [70, 85, 95]
  
  // NEW: Operating hours (null = 24/7)
  operatingHoursStart: v.optional(v.string()), // HH:mm
  operatingHoursEnd: v.optional(v.string()), // HH:mm
  
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/backend/convex/schema.ts` | Modify (major changes) |
| `packages/backend/convex/lib/validators.ts` | Add new validators |
| `packages/backend/convex/containers/` | Create new directory |
| `packages/backend/convex/containers/queries.ts` | Create |
| `packages/backend/convex/containers/mutations.ts` | Create |
| `packages/backend/convex/audit/` | Create new directory |
| `packages/backend/convex/audit/mutations.ts` | Create |
| `packages/backend/convex/audit/queries.ts` | Create |

---

## Phase 2: Core Backend Functions Refactoring

**Duration:** 5-7 days  
**Dependencies:** Phase 1

### 2.1 Update Permissions System

**File:** `packages/backend/convex/lib/permissions.ts`

```typescript
// Update AuthenticatedUser type
export type AuthenticatedUser = {
  userId: UserId;
  email: string;
  name: string | undefined;
  apcsRole: ApcsRole | null;
  // Remove carrierCompanyId, add:
  isCarrier: boolean;
};

// Remove carrier company related functions
// Update canViewCarrier -> canViewCarrierUser
// Update canManageCarrier -> canManageCarrierUser

export async function canManageTruck(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  truckId: Id<"trucks">
): Promise<boolean> {
  const truck = await ctx.db.get(truckId);
  if (!truck) return false;
  
  // Port admin can manage all
  if (user.apcsRole === "port_admin") return true;
  
  // Carrier can only manage their own trucks
  if (user.apcsRole === "carrier") {
    return truck.ownerId === user.userId;
  }
  
  return false;
}
```

### 2.2 Update Capacity Engine

**File:** `packages/backend/convex/lib/capacity.ts`

```typescript
/**
 * Get terminal capacity for a time slot
 * Now terminal-level instead of gate-level
 */
export async function getTerminalSlotCapacity(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string,
  endTime: string
): Promise<{
  available: number;
  total: number;
  booked: number;
  autoValidationLimit: number;
  pendingCount: number;
}> {
  // Find matching slot
  const slot = await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("startTime"), startTime),
        q.eq(q.field("endTime"), endTime)
      )
    )
    .first();

  if (!slot) {
    return { available: 0, total: 0, booked: 0, autoValidationLimit: 0, pendingCount: 0 };
  }

  // Count pending bookings
  const pendingBookings = await ctx.db
    .query("bookings")
    .withIndex("by_terminal_and_status", (q) =>
      q.eq("terminalId", terminalId).eq("status", "pending")
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("preferredDate"), date),
        q.eq(q.field("preferredTimeStart"), startTime)
      )
    )
    .collect();

  const autoValidationLimit = Math.floor(
    (slot.maxCapacity * slot.autoValidationThreshold) / 100
  );

  return {
    available: Math.max(0, slot.maxCapacity - slot.currentBookings),
    total: slot.maxCapacity,
    booked: slot.currentBookings,
    autoValidationLimit,
    pendingCount: pendingBookings.length,
  };
}

/**
 * Check if booking should be auto-validated
 */
export async function shouldAutoValidate(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  slotId: Id<"timeSlots">
): Promise<boolean> {
  const slot = await ctx.db.get(slotId);
  if (!slot) return false;

  // Get confirmed bookings count for this slot
  const confirmedCount = await ctx.db
    .query("bookings")
    .withIndex("by_time_slot_and_status", (q) =>
      q.eq("timeSlotId", slotId).eq("status", "confirmed")
    )
    .collect();

  const autoValidationLimit = Math.floor(
    (slot.maxCapacity * slot.autoValidationThreshold) / 100
  );

  return confirmedCount.length < autoValidationLimit;
}
```

### 2.3 Update Booking Mutations

**File:** `packages/backend/convex/bookings/mutations.ts`

Major changes:
- Remove carrier company references
- Add container selection
- Implement auto-validation logic
- Gate assignment at approval time
- Generate terminal-prefixed references

```typescript
/**
 * Generate booking reference with terminal prefix
 * Format: TER1-BK-001234
 */
async function generateBookingReference(
  ctx: MutationCtx,
  terminalCode: string
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  
  // Count bookings for this terminal today
  const count = await ctx.db
    .query("bookings")
    .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId))
    .filter((q) => 
      q.gte(q.field("bookedAt"), new Date(today.setHours(0,0,0,0)).getTime())
    )
    .collect();

  const sequence = String(count.length + 1).padStart(6, "0");
  return `${terminalCode}-BK-${sequence}`;
}

/**
 * Create booking (carrier only)
 * One booking = one truck + multiple containers
 */
export const create = mutation({
  args: {
    terminalId: v.id("terminals"),
    truckId: v.id("trucks"),
    containerIds: v.array(v.id("containers")),
    preferredDate: v.string(),
    preferredTimeStart: v.string(),
    preferredTimeEnd: v.string(),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverIdNumber: v.optional(v.string()),
  },
  returns: v.object({
    bookingId: v.id("bookings"),
    status: bookingStatusValidator,
    wasAutoValidated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    // Validate truck ownership
    const truck = await ctx.db.get(args.truckId);
    if (!truck || truck.ownerId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only book with your own trucks",
      });
    }

    // Validate containers
    for (const containerId of args.containerIds) {
      const container = await ctx.db.get(containerId);
      if (!container || container.ownerId !== user.userId) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "You can only book your own containers",
        });
      }
      if (container.bookingId) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: `Container ${container.containerNumber} is already assigned to a booking`,
        });
      }
    }

    // Check terminal capacity
    const capacity = await getTerminalSlotCapacity(
      ctx,
      args.terminalId,
      args.preferredDate,
      args.preferredTimeStart,
      args.preferredTimeEnd
    );

    if (capacity.available <= 0) {
      throw new ConvexError({
        code: "CAPACITY_FULL",
        message: "No capacity available for this time slot",
      });
    }

    // Determine if auto-validation applies
    const slot = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.preferredDate)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("startTime"), args.preferredTimeStart),
          q.eq(q.field("endTime"), args.preferredTimeEnd)
        )
      )
      .first();

    if (!slot) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Time slot not found",
      });
    }

    const shouldAutoValidate = await shouldAutoValidate(ctx, args.terminalId, slot._id);

    const terminal = await ctx.db.get(args.terminalId);
    const bookingReference = await generateBookingReference(ctx, terminal!.code);
    const now = Date.now();

    const bookingId = await ctx.db.insert("bookings", {
      terminalId: args.terminalId,
      carrierId: user.userId,
      truckId: args.truckId,
      containerIds: args.containerIds,
      bookingReference,
      status: shouldAutoValidate ? "confirmed" : "pending",
      wasAutoValidated: shouldAutoValidate,
      preferredDate: args.preferredDate,
      preferredTimeStart: args.preferredTimeStart,
      preferredTimeEnd: args.preferredTimeEnd,
      driverName: args.driverName?.trim(),
      driverPhone: args.driverPhone?.trim(),
      driverIdNumber: args.driverIdNumber?.trim(),
      bookedAt: now,
      confirmedAt: shouldAutoValidate ? now : undefined,
      timeSlotId: slot._id,
      createdBy: user.userId,
      updatedAt: now,
    });

    // Update containers
    for (const containerId of args.containerIds) {
      await ctx.db.patch(containerId, { bookingId, updatedAt: now });
    }

    // Update slot capacity
    await ctx.db.patch(slot._id, {
      currentBookings: slot.currentBookings + 1,
      updatedAt: now,
    });

    // If auto-validated, assign gate and generate QR
    if (shouldAutoValidate) {
      await assignGateToBooking(ctx, bookingId, args.terminalId, slot._id);
      await generateAndStoreQRCode(ctx, bookingId, bookingReference);
    }

    return {
      bookingId,
      status: shouldAutoValidate ? "confirmed" : "pending",
      wasAutoValidated: shouldAutoValidate,
    };
  },
});
```

### 2.4 Gate Assignment Logic

**File:** `packages/backend/convex/bookings/internal.ts`

```typescript
/**
 * Assign an available gate to a booking
 * Called at approval time (manual or auto)
 */
export async function assignGateToBooking(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
  terminalId: Id<"terminals">,
  timeSlotId: Id<"timeSlots">
): Promise<Id<"gates">> {
  const booking = await ctx.db.get(bookingId);
  const truck = await ctx.db.get(booking!.truckId);
  
  // Get all active gates for terminal
  const gates = await ctx.db
    .query("gates")
    .withIndex("by_terminal_and_active", (q) =>
      q.eq("terminalId", terminalId).eq("isActive", true)
    )
    .collect();

  // Filter gates compatible with truck
  const compatibleGates = gates.filter((gate) =>
    gate.allowedTruckTypes.includes(truck!.truckType) &&
    gate.allowedTruckClasses.includes(truck!.truckClass)
  );

  if (compatibleGates.length === 0) {
    throw new ConvexError({
      code: "NO_COMPATIBLE_GATE",
      message: "No gates available that support this truck type",
    });
  }

  // Find gate with lowest current load for this slot
  let selectedGate = compatibleGates[0];
  let lowestLoad = Infinity;

  for (const gate of compatibleGates) {
    const gateBookings = await ctx.db
      .query("bookings")
      .withIndex("by_gate", (q) => q.eq("gateId", gate._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("timeSlotId"), timeSlotId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .collect();

    if (gateBookings.length < lowestLoad) {
      lowestLoad = gateBookings.length;
      selectedGate = gate;
    }
  }

  await ctx.db.patch(bookingId, {
    gateId: selectedGate._id,
    updatedAt: Date.now(),
  });

  return selectedGate._id;
}
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/backend/convex/lib/permissions.ts` | Modify |
| `packages/backend/convex/lib/capacity.ts` | Major refactor |
| `packages/backend/convex/bookings/mutations.ts` | Major refactor |
| `packages/backend/convex/bookings/queries.ts` | Modify |
| `packages/backend/convex/bookings/internal.ts` | Major refactor |
| `packages/backend/convex/trucks/mutations.ts` | Modify (remove carrier company) |
| `packages/backend/convex/trucks/queries.ts` | Modify |
| `packages/backend/convex/containers/mutations.ts` | Create |
| `packages/backend/convex/containers/queries.ts` | Create |

---

## Phase 3: AI Tools and Conversational Flows

**Duration:** 7-10 days  
**Dependencies:** Phase 1, Phase 2

### 3.1 Update Agent Configuration (French-only)

**File:** `packages/backend/convex/ai/agent.ts`

```typescript
export const apcsAgent = new Agent(components.agent, {
  name: "Assistant APCS",
  languageModel: google("gemini-2.0-flash"),
  instructions: `Tu es l'assistant du système APCS (Advanced Port Container System).
Tu aides les utilisateurs à gérer les opérations portuaires, les réservations de camions et la logistique.

IMPORTANT: Tu dois TOUJOURS répondre en français, quelle que soit la langue de l'utilisateur.

Informations clés:
- Le système gère des terminaux, chacun avec des créneaux horaires pour les réservations de camions.
- Il y a trois rôles: port_admin (administrateur portuaire), terminal_operator (opérateur terminal), carrier (transporteur).
- Les réservations suivent un cycle: en attente → confirmée/rejetée → consommée/annulée/expirée.
- Une réservation = un camion + plusieurs conteneurs.
- La capacité est gérée au niveau du terminal (nombre de camions par créneau).
- Les premiers N% de créneaux sont auto-validés (N configurable par admin).

Pour les transporteurs (carriers):
- Guide-les dans le processus de réservation étape par étape.
- Demande d'abord les conteneurs à transporter.
- Suggère les créneaux optimaux (équilibrage de charge, urgence, temps d'attente minimal).
- Affiche les widgets de données intégrés pour visualiser les informations.

Guidelines:
- Utilise TOUJOURS les outils disponibles pour obtenir des données réelles. Ne jamais inventer d'informations.
- Présente les données de manière structurée et claire.
- Si l'utilisateur demande quelque chose hors de tes capacités, informe-le poliment.
- Si un outil retourne ACCESS_DENIED, explique que le rôle de l'utilisateur ne permet pas cette action.
- Sois concis mais complet.`,
  tools: ALL_TOOLS,
  maxSteps: 10,
});
```

### 3.2 New AI Tools for Carriers

**File:** `packages/backend/convex/ai/tools/containers.ts`

```typescript
/**
 * List carrier's containers
 * Widget: <ContainerList />
 */
export const listMyContainers = createTool({
  description:
    "Liste les conteneurs du transporteur. " +
    "Peut filtrer par type, opération (enlèvement/dépôt), ou disponibilité.",
  args: z.object({
    operationType: z.enum(["pick_up", "drop_off"]).optional()
      .describe("Filtrer par type d'opération"),
    available: z.boolean().optional()
      .describe("Uniquement les conteneurs non assignés"),
    limit: z.number().optional()
      .describe("Nombre maximum de résultats (défaut 50)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listMyContainers");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.listMyContainers,
      {
        userId: ctx.userId!,
        operationType: args.operationType,
        available: args.available ?? true,
        limit: args.limit ?? 50,
      },
    );
  },
});

/**
 * Select containers for booking
 * Widget: <ContainerSelector />
 */
export const selectContainersForBooking = createTool({
  description:
    "Permet de sélectionner des conteneurs pour une réservation. " +
    "Retourne un widget de sélection interactif.",
  args: z.object({
    containerIds: z.array(z.string())
      .describe("IDs des conteneurs à sélectionner"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "selectContainersForBooking");
    if (denied) return denied;

    // Validate containers belong to user and are available
    return await ctx.runQuery(
      internal.ai.internalQueries.validateContainerSelection,
      {
        userId: ctx.userId!,
        containerIds: args.containerIds,
      },
    );
  },
});
```

**File:** `packages/backend/convex/ai/tools/slots.ts`

```typescript
/**
 * Get optimal slot suggestions
 * Uses load balancing + urgency + wait time optimization
 * Widget: <SlotSuggestions />
 */
export const suggestOptimalSlots = createTool({
  description:
    "Suggère les créneaux horaires optimaux pour une réservation. " +
    "Prend en compte: équilibrage de charge, urgence des conteneurs, temps d'attente minimal. " +
    "Retourne les 5 meilleurs créneaux avec scores.",
  args: z.object({
    terminalId: z.string().describe("ID du terminal"),
    containerIds: z.array(z.string())
      .describe("IDs des conteneurs à transporter"),
    preferredDate: z.string().optional()
      .describe("Date préférée (YYYY-MM-DD)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "suggestOptimalSlots");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.suggestOptimalSlots,
      {
        userId: ctx.userId!,
        terminalId: args.terminalId,
        containerIds: args.containerIds,
        preferredDate: args.preferredDate,
      },
    );
  },
});

/**
 * Get slot availability for a terminal
 * Widget: <SlotCalendar />
 */
export const getSlotAvailability = createTool({
  description:
    "Affiche la disponibilité des créneaux pour un terminal sur une période. " +
    "Montre la capacité totale, réservée, et disponible par créneau.",
  args: z.object({
    terminalId: z.string().describe("ID du terminal"),
    startDate: z.string().describe("Date de début (YYYY-MM-DD)"),
    endDate: z.string().describe("Date de fin (YYYY-MM-DD)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getSlotAvailability");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.getSlotAvailability,
      {
        userId: ctx.userId!,
        terminalId: args.terminalId,
        startDate: args.startDate,
        endDate: args.endDate,
      },
    );
  },
});
```

**File:** `packages/backend/convex/ai/tools/booking-flow.ts`

```typescript
/**
 * Create booking via AI (mutation tool)
 * Widget: <BookingConfirmationCard />
 */
export const createBookingViaAI = createTool({
  description:
    "Crée une réservation. Requiert: terminal, camion, conteneurs, créneau. " +
    "Retourne une carte de confirmation avec statut (auto-validé ou en attente).",
  args: z.object({
    terminalId: z.string().describe("ID du terminal"),
    truckId: z.string().describe("ID du camion"),
    containerIds: z.array(z.string()).describe("IDs des conteneurs"),
    slotDate: z.string().describe("Date du créneau (YYYY-MM-DD)"),
    slotStartTime: z.string().describe("Heure de début (HH:mm)"),
    slotEndTime: z.string().describe("Heure de fin (HH:mm)"),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "createBookingViaAI");
    if (denied) return denied;

    return await ctx.runMutation(
      internal.ai.mutations.createBooking,
      {
        userId: ctx.userId!,
        terminalId: args.terminalId as Id<"terminals">,
        truckId: args.truckId as Id<"trucks">,
        containerIds: args.containerIds as Id<"containers">[],
        slotDate: args.slotDate,
        slotStartTime: args.slotStartTime,
        slotEndTime: args.slotEndTime,
        driverName: args.driverName,
        driverPhone: args.driverPhone,
      },
    );
  },
});

/**
 * Cancel booking via AI
 */
export const cancelBookingViaAI = createTool({
  description:
    "Annule une réservation existante. " +
    "Le transporteur peut annuler ses propres réservations à tout moment.",
  args: z.object({
    bookingReference: z.string()
      .describe("Référence de la réservation (ex: TER1-BK-001234)"),
    reason: z.string().optional()
      .describe("Raison de l'annulation"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "cancelBookingViaAI");
    if (denied) return denied;

    return await ctx.runMutation(
      internal.ai.mutations.cancelBooking,
      {
        userId: ctx.userId!,
        bookingReference: args.bookingReference,
        reason: args.reason,
      },
    );
  },
});
```

### 3.3 Update Tool Registry

**File:** `packages/backend/convex/ai/registry.ts`

```typescript
import {
  listMyBookings,
  getBookingDetails,
  listBookingsByTerminal,
  listPendingBookings,
} from "./tools/bookings";
import {
  listTerminals,
  getTerminalDetails,
} from "./tools/terminals";
import {
  listMyContainers,
  selectContainersForBooking,
} from "./tools/containers";
import {
  suggestOptimalSlots,
  getSlotAvailability,
} from "./tools/slots";
import {
  createBookingViaAI,
  cancelBookingViaAI,
  changeTruckViaAI,
} from "./tools/booking-flow";
import {
  listMyTrucks,
} from "./tools/trucks";
import { getSystemConfig } from "./tools/config";

export const ALL_TOOLS = {
  // Queries
  listMyBookings,
  getBookingDetails,
  listBookingsByTerminal,
  listPendingBookings,
  listTerminals,
  getTerminalDetails,
  listMyContainers,
  listMyTrucks,
  selectContainersForBooking,
  suggestOptimalSlots,
  getSlotAvailability,
  getSystemConfig,
  
  // Mutations
  createBookingViaAI,
  cancelBookingViaAI,
  changeTruckViaAI,
} as const;
```

### 3.4 Update Tool Permissions

**File:** `packages/backend/convex/ai/tools/types.ts`

```typescript
export const TOOL_PERMISSIONS: Record<ApcsRole, ToolName[]> = {
  carrier: [
    "listMyBookings",
    "getBookingDetails",
    "listTerminals",
    "getTerminalDetails",
    "listMyContainers",
    "listMyTrucks",
    "selectContainersForBooking",
    "suggestOptimalSlots",
    "getSlotAvailability",
    "getSystemConfig",
    "createBookingViaAI",
    "cancelBookingViaAI",
    "changeTruckViaAI",
  ],
  terminal_operator: [
    "listBookingsByTerminal",
    "listPendingBookings",
    "getBookingDetails",
    "listTerminals",
    "getTerminalDetails",
    "getSlotAvailability",
    "getSystemConfig",
  ],
  port_admin: [
    // All tools
    "listMyBookings",
    "getBookingDetails",
    "listBookingsByTerminal",
    "listPendingBookings",
    "listTerminals",
    "getTerminalDetails",
    "listMyContainers",
    "listMyTrucks",
    "selectContainersForBooking",
    "suggestOptimalSlots",
    "getSlotAvailability",
    "getSystemConfig",
    "createBookingViaAI",
    "cancelBookingViaAI",
    "changeTruckViaAI",
  ],
};
```

### 3.5 AI Chat Widget Components

**Files to create in:** `apps/web/src/components/ai-elements/apcs/`

| Component | Purpose |
|-----------|---------|
| `container-list.tsx` | Display carrier's containers |
| `container-selector.tsx` | Interactive container selection |
| `slot-suggestions.tsx` | Show optimal slot recommendations |
| `slot-calendar.tsx` | Availability calendar view |
| `booking-confirmation-card.tsx` | Booking result with status |
| `truck-selector.tsx` | Truck selection for booking |
| `booking-summary.tsx` | Expandable booking details |

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/backend/convex/ai/agent.ts` | Modify (French instructions) |
| `packages/backend/convex/ai/registry.ts` | Modify (add new tools) |
| `packages/backend/convex/ai/tools/types.ts` | Modify (permissions) |
| `packages/backend/convex/ai/tools/containers.ts` | Create |
| `packages/backend/convex/ai/tools/slots.ts` | Create |
| `packages/backend/convex/ai/tools/booking-flow.ts` | Create |
| `packages/backend/convex/ai/tools/trucks.ts` | Create |
| `packages/backend/convex/ai/mutations.ts` | Create |
| `packages/backend/convex/ai/internalQueries.ts` | Major update |
| `apps/web/src/components/ai-elements/apcs/*.tsx` | Create (7 files) |

---

## Phase 4: Time Slot Bulk Editing System

**Duration:** 4-5 days  
**Dependencies:** Phase 1, Phase 2

### 4.1 Bulk Edit Mutations

**File:** `packages/backend/convex/timeSlots/mutations.ts`

```typescript
/**
 * Bulk create slots from a day template
 * Copies one day's pattern to other days
 */
export const copyDayTemplate = mutation({
  args: {
    terminalId: v.id("terminals"),
    sourceDate: v.string(), // Date to copy from
    targetDates: v.array(v.string()), // Dates to copy to
    skipExisting: v.boolean(),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);
    await requireTerminalAccess(ctx, user, args.terminalId);

    // Get source day's slots
    const sourceSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.sourceDate)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (sourceSlots.length === 0) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "No slots found for source date",
      });
    }

    let created = 0;
    let skipped = 0;
    const now = Date.now();

    for (const targetDate of args.targetDates) {
      if (args.skipExisting) {
        const existing = await ctx.db
          .query("timeSlots")
          .withIndex("by_terminal_and_date", (q) =>
            q.eq("terminalId", args.terminalId).eq("date", targetDate)
          )
          .first();
        if (existing) {
          skipped += sourceSlots.length;
          continue;
        }
      }

      for (const slot of sourceSlots) {
        await ctx.db.insert("timeSlots", {
          terminalId: args.terminalId,
          date: targetDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxCapacity: slot.maxCapacity,
          autoValidationThreshold: slot.autoValidationThreshold,
          currentBookings: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdBy: user.userId,
        });
        created++;
      }
    }

    return { created, skipped };
  },
});

/**
 * Create weekly recurring pattern
 * Apply same slots for specific days of week
 */
export const createWeeklyPattern = mutation({
  args: {
    terminalId: v.id("terminals"),
    startDate: v.string(),
    endDate: v.string(),
    daysOfWeek: v.array(v.number()), // 0=Sunday, 1=Monday, etc.
    slots: v.array(v.object({
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      autoValidationThreshold: v.number(),
    })),
    skipExisting: v.boolean(),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);
    await requireTerminalAccess(ctx, user, args.terminalId);

    // Generate all dates in range that match daysOfWeek
    const dates: string[] = [];
    const current = new Date(args.startDate);
    const end = new Date(args.endDate);

    while (current <= end) {
      if (args.daysOfWeek.includes(current.getDay())) {
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    let created = 0;
    let skipped = 0;
    const now = Date.now();

    for (const date of dates) {
      if (args.skipExisting) {
        const existing = await ctx.db
          .query("timeSlots")
          .withIndex("by_terminal_and_date", (q) =>
            q.eq("terminalId", args.terminalId).eq("date", date)
          )
          .first();
        if (existing) {
          skipped += args.slots.length;
          continue;
        }
      }

      for (const slotTemplate of args.slots) {
        await ctx.db.insert("timeSlots", {
          terminalId: args.terminalId,
          date,
          ...slotTemplate,
          currentBookings: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdBy: user.userId,
        });
        created++;
      }
    }

    return { created, skipped };
  },
});

/**
 * Bulk update capacity for multiple slots
 */
export const bulkUpdateCapacity = mutation({
  args: {
    terminalId: v.id("terminals"),
    date: v.string(),
    slotIds: v.optional(v.array(v.id("timeSlots"))), // If not provided, updates all on date
    maxCapacity: v.number(),
    autoValidationThreshold: v.optional(v.number()),
  },
  returns: v.number(), // Count of updated slots
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);
    await requireTerminalAccess(ctx, user, args.terminalId);

    let slotsToUpdate;
    
    if (args.slotIds) {
      slotsToUpdate = await Promise.all(
        args.slotIds.map((id) => ctx.db.get(id))
      );
    } else {
      slotsToUpdate = await ctx.db
        .query("timeSlots")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", args.terminalId).eq("date", args.date)
        )
        .collect();
    }

    const now = Date.now();
    let updated = 0;

    for (const slot of slotsToUpdate) {
      if (!slot) continue;
      
      // Can't reduce below current bookings
      if (args.maxCapacity < slot.currentBookings) {
        continue;
      }

      await ctx.db.patch(slot._id, {
        maxCapacity: args.maxCapacity,
        autoValidationThreshold: args.autoValidationThreshold ?? slot.autoValidationThreshold,
        updatedAt: now,
      });
      updated++;
    }

    return updated;
  },
});
```

### 4.2 Slot Management UI Components

**Files to create in:** `apps/web/src/features/time-slots/`

| File | Purpose |
|------|---------|
| `components/slot-editor.tsx` | Individual slot editing |
| `components/bulk-slot-editor.tsx` | Bulk editing interface |
| `components/day-template-picker.tsx` | Copy day template modal |
| `components/weekly-pattern-wizard.tsx` | Weekly pattern configuration |
| `components/slot-calendar-view.tsx` | Calendar view of all slots |
| `hooks/use-slot-editing.ts` | State management for editing |

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/backend/convex/timeSlots/mutations.ts` | Major update |
| `packages/backend/convex/timeSlots/queries.ts` | Add bulk queries |
| `apps/web/src/features/time-slots/` | Create directory + 6 files |
| `apps/web/src/routes/operator/slots.tsx` | Create |

---

## Phase 5: Auto-Validation and Booking Approval Workflows

**Duration:** 3-4 days  
**Dependencies:** Phase 1, Phase 2, Phase 4

### 5.1 Auto-Validation Engine

**File:** `packages/backend/convex/lib/autoValidation.ts`

```typescript
/**
 * Auto-validation engine
 * Determines if a booking should be auto-approved based on threshold
 */

export interface AutoValidationResult {
  shouldAutoValidate: boolean;
  reason: string;
  currentAutoValidatedCount: number;
  autoValidationLimit: number;
  thresholdPercent: number;
}

export async function checkAutoValidation(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  slotId: Id<"timeSlots">
): Promise<AutoValidationResult> {
  const slot = await ctx.db.get(slotId);
  if (!slot) {
    return {
      shouldAutoValidate: false,
      reason: "Créneau non trouvé",
      currentAutoValidatedCount: 0,
      autoValidationLimit: 0,
      thresholdPercent: 0,
    };
  }

  // Get terminal for potential override
  const terminal = await ctx.db.get(terminalId);
  const thresholdPercent = terminal?.autoValidationThreshold ?? slot.autoValidationThreshold;
  
  const autoValidationLimit = Math.floor(
    (slot.maxCapacity * thresholdPercent) / 100
  );

  // Count current auto-validated bookings for this slot
  const autoValidatedBookings = await ctx.db
    .query("bookings")
    .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slotId))
    .filter((q) =>
      q.and(
        q.eq(q.field("wasAutoValidated"), true),
        q.eq(q.field("status"), "confirmed")
      )
    )
    .collect();

  const currentAutoValidatedCount = autoValidatedBookings.length;
  const shouldAutoValidate = currentAutoValidatedCount < autoValidationLimit;

  return {
    shouldAutoValidate,
    reason: shouldAutoValidate
      ? `Auto-validation disponible (${currentAutoValidatedCount}/${autoValidationLimit})`
      : `Seuil atteint - validation manuelle requise (${currentAutoValidatedCount}/${autoValidationLimit})`,
    currentAutoValidatedCount,
    autoValidationLimit,
    thresholdPercent,
  };
}
```

### 5.2 Manual Approval Workflow

**File:** `packages/backend/convex/bookings/mutations.ts`

```typescript
/**
 * Confirm a pending booking (terminal operator/admin)
 * Assigns gate and generates QR code
 */
export const confirmBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    gateId: v.optional(v.id("gates")), // If not provided, auto-assign
    note: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    gateAssigned: v.id("gates"),
    qrCodeGenerated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Réservation non trouvée" });
    }

    await requireTerminalAccess(ctx, user, booking.terminalId);

    if (booking.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de confirmer une réservation avec le statut "${booking.status}"`,
      });
    }

    // Assign gate
    let gateId: Id<"gates">;
    if (args.gateId) {
      // Validate specified gate
      const gate = await ctx.db.get(args.gateId);
      if (!gate || gate.terminalId !== booking.terminalId) {
        throw new ConvexError({ code: "INVALID_INPUT", message: "Portail invalide" });
      }
      gateId = args.gateId;
    } else {
      // Auto-assign gate
      gateId = await assignGateToBooking(ctx, args.bookingId, booking.terminalId, booking.timeSlotId!);
    }

    const now = Date.now();

    // Update booking
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      gateId,
      confirmedAt: now,
      processedBy: user.userId,
      updatedAt: now,
    });

    // Generate QR code
    await generateAndStoreQRCode(ctx, args.bookingId, booking.bookingReference);

    // Record history
    await recordBookingHistory(ctx, args.bookingId, "status_changed", {
      previousValue: "pending",
      newValue: "confirmed",
      note: args.note,
      changedBy: user.userId,
    });

    // Send notification
    await scheduleNotification(ctx, {
      userId: booking.carrierId,
      type: "booking_confirmed",
      bookingId: args.bookingId,
    });

    return {
      success: true,
      gateAssigned: gateId,
      qrCodeGenerated: true,
    };
  },
});
```

### 5.3 Approval Queue UI

**Files to create in:** `apps/web/src/features/approvals/`

| File | Purpose |
|------|---------|
| `components/approval-queue.tsx` | List of pending bookings |
| `components/approval-card.tsx` | Single booking approval UI |
| `components/bulk-approval.tsx` | Approve multiple bookings |
| `components/gate-assignment-modal.tsx` | Manual gate selection |
| `hooks/use-approvals.ts` | Approval state management |

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/backend/convex/lib/autoValidation.ts` | Create |
| `packages/backend/convex/bookings/mutations.ts` | Update confirm logic |
| `apps/web/src/features/approvals/` | Create directory + 5 files |
| `apps/web/src/routes/operator/approvals.tsx` | Create |

---

## Phase 6: Notification System with Email Integration

**Duration:** 4-5 days  
**Dependencies:** Phase 1, Phase 5

### 6.1 Notification Service

**File:** `packages/backend/convex/notifications/service.ts`

```typescript
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// Notification templates (French)
const NOTIFICATION_TEMPLATES = {
  booking_created: {
    titleFr: "Réservation créée",
    bodyFr: "Votre réservation {reference} a été créée et est en attente de confirmation.",
  },
  booking_confirmed: {
    titleFr: "Réservation confirmée",
    bodyFr: "Votre réservation {reference} a été confirmée pour le {date} à {time}. Portail: {gate}.",
  },
  booking_rejected: {
    titleFr: "Réservation refusée",
    bodyFr: "Votre réservation {reference} a été refusée. Raison: {reason}",
  },
  booking_cancelled: {
    titleFr: "Réservation annulée",
    bodyFr: "Votre réservation {reference} a été annulée.",
  },
  booking_reminder: {
    titleFr: "Rappel de réservation",
    bodyFr: "Rappel: Votre réservation {reference} est prévue dans {hours} heures.",
  },
  capacity_alert: {
    titleFr: "Alerte de capacité",
    bodyFr: "Le terminal {terminal} atteint {percent}% de capacité pour le {date}.",
  },
};

/**
 * Send notification (in-app + email)
 */
export const sendNotification = action({
  args: {
    userId: v.string(),
    type: notificationTypeValidator,
    data: v.object({
      bookingId: v.optional(v.id("bookings")),
      terminalId: v.optional(v.id("terminals")),
      reference: v.optional(v.string()),
      date: v.optional(v.string()),
      time: v.optional(v.string()),
      gate: v.optional(v.string()),
      reason: v.optional(v.string()),
      hours: v.optional(v.number()),
      terminal: v.optional(v.string()),
      percent: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const template = NOTIFICATION_TEMPLATES[args.type];
    
    // Replace placeholders
    let bodyFr = template.bodyFr;
    for (const [key, value] of Object.entries(args.data)) {
      if (value !== undefined) {
        bodyFr = bodyFr.replace(`{${key}}`, String(value));
      }
    }

    // Get user preferences
    const userProfile = await ctx.runQuery(internal.users.queries.getProfile, {
      userId: args.userId,
    });

    const channel = userProfile?.notificationChannel ?? "both";

    // Create in-app notification
    const notificationId = await ctx.runMutation(
      internal.notifications.internal.create,
      {
        userId: args.userId,
        type: args.type,
        channel,
        titleFr: template.titleFr,
        titleEn: template.titleFr, // French-only for now
        bodyFr,
        bodyEn: bodyFr,
        relatedEntityType: args.data.bookingId ? "booking" : 
                          args.data.terminalId ? "terminal" : undefined,
        relatedEntityId: args.data.bookingId ?? args.data.terminalId,
      }
    );

    // Send email if enabled
    if (channel === "email" || channel === "both") {
      const user = await ctx.runQuery(internal.users.queries.getById, {
        userId: args.userId,
      });

      if (user?.email) {
        await ctx.runAction(internal.email.sendEmail, {
          to: user.email,
          subject: template.titleFr,
          body: bodyFr,
          notificationId,
        });
      }
    }

    return notificationId;
  },
});
```

### 6.2 Email Service (Resend)

**File:** `packages/backend/convex/email/index.ts`

```typescript
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    notificationId: v.optional(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    try {
      const result = await resend.emails.send({
        from: "APCS <noreply@apcs.port.com>",
        to: args.to,
        subject: `[APCS] ${args.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0066CC; color: white; padding: 20px; text-align: center;">
              <h1>APCS - Port Booking System</h1>
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <p>${args.body}</p>
            </div>
            <div style="padding: 10px; text-align: center; color: #666; font-size: 12px;">
              Ce message a été envoyé automatiquement par le système APCS.
            </div>
          </div>
        `,
      });

      // Update notification with email status
      if (args.notificationId) {
        await ctx.runMutation(internal.notifications.internal.markEmailSent, {
          notificationId: args.notificationId,
          success: true,
        });
      }

      return { success: true, id: result.id };
    } catch (error) {
      // Log error and update notification
      if (args.notificationId) {
        await ctx.runMutation(internal.notifications.internal.markEmailSent, {
          notificationId: args.notificationId,
          success: false,
          error: String(error),
        });
      }
      throw error;
    }
  },
});
```

### 6.3 Capacity Alert System

**File:** `packages/backend/convex/scheduled.ts`

```typescript
/**
 * Check capacity thresholds and send alerts
 * Called by cron job
 */
export const checkCapacityAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all terminals with alert thresholds
    const terminals = await ctx.db
      .query("terminals")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    for (const terminal of terminals) {
      if (!terminal.capacityAlertThresholds?.length) continue;

      // Get tomorrow's slots
      const slots = await ctx.db
        .query("timeSlots")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", terminal._id).eq("date", tomorrowStr)
        )
        .collect();

      for (const slot of slots) {
        const utilization = Math.round(
          (slot.currentBookings / slot.maxCapacity) * 100
        );

        // Check if utilization crosses any threshold
        for (const threshold of terminal.capacityAlertThresholds) {
          if (utilization >= threshold) {
            // Send alert to all terminal operators
            const operators = await ctx.db
              .query("terminalOperatorAssignments")
              .withIndex("by_terminal_and_active", (q) =>
                q.eq("terminalId", terminal._id).eq("isActive", true)
              )
              .collect();


...27035 bytes truncated...

The tool call succeeded but the output was truncated. Full output saved to: /home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE
Use the Task tool to have explore agent process this file with Grep and Read (with offset/limit). Do NOT read the full file yourself - delegate to save context.
```

---

## Assistant (Plan · claude-opus-4.5 · 5.3s)

Let me read the full plan output that was generated:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "offset": 0,
  "limit": 500
}
```

**Output:**
```
<file>
00001| Now I have a comprehensive understanding of the existing codebase. Let me create a detailed implementation plan.
00002| 
00003| # APCS Maritime Port Booking System - Implementation Plan
00004| 
00005| ## Executive Summary
00006| 
00007| This document outlines a phased implementation plan for transforming the existing APCS system based on the comprehensive requirements. The plan is organized into 11 phases, prioritized by dependencies and business value.
00008| 
00009| ---
00010| 
00011| ## Phase 1: Schema Refactoring (Foundation)
00012| 
00013| **Duration:** 3-5 days  
00014| **Priority:** Critical - All subsequent phases depend on this
00015| 
00016| ### 1.1 Remove Carrier Company Concept
00017| 
00018| **File:** `packages/backend/convex/schema.ts`
00019| 
00020| **Changes:**
00021| - Remove `carrierCompanies` table
00022| - Remove `carrierUsers` table
00023| - Modify `trucks` table: remove `carrierCompanyId`, add `ownerId: v.string()` (Better Auth user ID)
00024| 
00025| ```typescript
00026| // REMOVE these tables:
00027| // - carrierCompanies
00028| // - carrierUsers
00029| 
00030| // MODIFY trucks table:
00031| trucks: defineTable({
00032|   ownerId: v.string(), // Better Auth user ID (carrier)
00033|   licensePlate: v.string(),
00034|   truckType: truckTypeValidator,
00035|   truckClass: truckClassValidator,
00036|   // ... rest remains same
00037| })
00038|   .index("by_owner", ["ownerId"])
00039|   .index("by_owner_and_active", ["ownerId", "isActive"])
00040|   // ... rest remains
00041| ```
00042| 
00043| ### 1.2 Add Containers Table
00044| 
00045| **File:** `packages/backend/convex/schema.ts`
00046| 
00047| ```typescript
00048| // Add new validators
00049| export const containerTypeValidator = v.union(
00050|   v.literal("dry"),
00051|   v.literal("reefer"),
00052|   v.literal("open_top"),
00053|   v.literal("flat_rack"),
00054|   v.literal("tank"),
00055|   v.literal("hazardous")
00056| );
00057| 
00058| export const containerDimensionsValidator = v.union(
00059|   v.literal("20ft"),
00060|   v.literal("40ft"),
00061|   v.literal("40ft_hc"),
00062|   v.literal("45ft")
00063| );
00064| 
00065| export const containerOperationValidator = v.union(
00066|   v.literal("pick_up"),
00067|   v.literal("drop_off")
00068| );
00069| 
00070| export const containerWeightClassValidator = v.union(
00071|   v.literal("light"),    // < 10t
00072|   v.literal("medium"),   // 10-20t
00073|   v.literal("heavy"),    // 20-30t
00074|   v.literal("max")       // > 30t
00075| );
00076| 
00077| // New table
00078| containers: defineTable({
00079|   ownerId: v.string(), // Carrier user ID
00080|   containerNumber: v.string(), // ISO 6346 format (e.g., MSCU1234567)
00081|   type: containerTypeValidator,
00082|   dimensions: containerDimensionsValidator,
00083|   weightClass: containerWeightClassValidator,
00084|   operationType: containerOperationValidator,
00085|   // For pick-up: when container will be ready
00086|   readyDate: v.optional(v.number()),
00087|   // For drop-off: expected departure date
00088|   departureDate: v.optional(v.number()),
00089|   isEmpty: v.boolean(),
00090|   // Booking assignment (null if unassigned)
00091|   bookingId: v.optional(v.id("bookings")),
00092|   // Metadata
00093|   isActive: v.boolean(),
00094|   createdAt: v.number(),
00095|   updatedAt: v.number(),
00096|   createdBy: v.string(),
00097| })
00098|   .index("by_owner", ["ownerId"])
00099|   .index("by_owner_and_active", ["ownerId", "isActive"])
00100|   .index("by_container_number", ["containerNumber"])
00101|   .index("by_booking", ["bookingId"])
00102|   .index("by_operation_type", ["operationType"])
00103|   .index("by_type", ["type"]),
00104| ```
00105| 
00106| ### 1.3 Refactor Bookings Table
00107| 
00108| **File:** `packages/backend/convex/schema.ts`
00109| 
00110| ```typescript
00111| bookings: defineTable({
00112|   // References (simplified)
00113|   terminalId: v.id("terminals"),
00114|   carrierId: v.string(), // Carrier user ID
00115|   truckId: v.id("trucks"),
00116|   // Gate assigned at approval (not at booking time)
00117|   gateId: v.optional(v.id("gates")),
00118|   timeSlotId: v.optional(v.id("timeSlots")), // Optional until gate assigned
00119|   
00120|   // Booking reference: TER1-BK-001234 (terminal-prefixed)
00121|   bookingReference: v.string(),
00122|   
00123|   // Status
00124|   status: bookingStatusValidator,
00125|   
00126|   // Auto-validation flag
00127|   wasAutoValidated: v.boolean(),
00128|   
00129|   // Container IDs (1:N relationship)
00130|   containerIds: v.array(v.id("containers")),
00131|   
00132|   // QR Code (generated on approval)
00133|   qrCode: v.optional(v.string()),
00134|   qrCodeStorageId: v.optional(v.id("_storage")),
00135|   
00136|   // Driver info
00137|   driverName: v.optional(v.string()),
00138|   driverPhone: v.optional(v.string()),
00139|   driverIdNumber: v.optional(v.string()),
00140|   
00141|   // Slot preference (before gate assignment)
00142|   preferredDate: v.string(), // YYYY-MM-DD
00143|   preferredTimeStart: v.string(), // HH:mm
00144|   preferredTimeEnd: v.string(), // HH:mm
00145|   
00146|   // Scan tracking
00147|   entryScannedAt: v.optional(v.number()),
00148|   exitScannedAt: v.optional(v.number()),
00149|   entryScannedBy: v.optional(v.string()),
00150|   exitScannedBy: v.optional(v.string()),
00151|   
00152|   // Timestamps
00153|   bookedAt: v.number(),
00154|   confirmedAt: v.optional(v.number()),
00155|   rejectedAt: v.optional(v.number()),
00156|   cancelledAt: v.optional(v.number()),
00157|   consumedAt: v.optional(v.number()),
00158|   expiredAt: v.optional(v.number()),
00159|   
00160|   // Rejection/cancellation reason
00161|   statusReason: v.optional(v.string()),
00162|   
00163|   // Who processed
00164|   processedBy: v.optional(v.string()),
00165|   createdBy: v.string(),
00166|   updatedAt: v.number(),
00167| })
00168|   .index("by_reference", ["bookingReference"])
00169|   .index("by_terminal", ["terminalId"])
00170|   .index("by_terminal_and_status", ["terminalId", "status"])
00171|   .index("by_terminal_and_date", ["terminalId", "preferredDate"])
00172|   .index("by_carrier", ["carrierId"])
00173|   .index("by_carrier_and_status", ["carrierId", "status"])
00174|   .index("by_truck", ["truckId"])
00175|   .index("by_gate", ["gateId"])
00176|   .index("by_time_slot", ["timeSlotId"])
00177|   .index("by_status", ["status"])
00178|   .index("by_created_by", ["createdBy"]),
00179| ```
00180| 
00181| ### 1.4 Update Time Slots for Terminal-Level Capacity
00182| 
00183| **File:** `packages/backend/convex/schema.ts`
00184| 
00185| ```typescript
00186| // Time slots now belong to terminal, not gate
00187| timeSlots: defineTable({
00188|   terminalId: v.id("terminals"), // Changed from gateId
00189|   date: v.string(), // YYYY-MM-DD
00190|   startTime: v.string(), // HH:mm (24h format)
00191|   endTime: v.string(), // HH:mm
00192|   // Capacity is truck count at terminal level
00193|   maxCapacity: v.number(),
00194|   currentBookings: v.number(),
00195|   // Auto-validation threshold (0-100%)
00196|   autoValidationThreshold: v.number(),
00197|   isActive: v.boolean(),
00198|   createdAt: v.number(),
00199|   updatedAt: v.number(),
00200|   createdBy: v.string(),
00201| })
00202|   .index("by_terminal", ["terminalId"])
00203|   .index("by_terminal_and_date", ["terminalId", "date"])
00204|   .index("by_date", ["date"])
00205|   .index("by_terminal_and_active", ["terminalId", "isActive"]),
00206| ```
00207| 
00208| ### 1.5 Add System Configuration for Auto-Validation
00209| 
00210| **File:** `packages/backend/convex/schema.ts`
00211| 
00212| Update `systemConfig`:
00213| ```typescript
00214| systemConfig: defineTable({
00215|   // Existing fields...
00216|   cancellationWindowHours: v.number(),
00217|   maxAdvanceBookingDays: v.number(),
00218|   minAdvanceBookingHours: v.number(),
00219|   reminderHoursBefore: v.array(v.number()),
00220|   
00221|   // NEW: Auto-validation threshold (global default, can be overridden per terminal)
00222|   defaultAutoValidationThreshold: v.number(), // 0-100 (percentage)
00223|   
00224|   // NEW: Grace period for no-shows (minutes after slot start)
00225|   noShowGracePeriodMinutes: v.number(),
00226|   
00227|   // NEW: Booking window settings
00228|   minBookingWindowHours: v.number(), // Minimum hours before slot
00229|   maxBookingWindowDays: v.number(), // Maximum days in advance
00230|   
00231|   updatedAt: v.number(),
00232|   updatedBy: v.string(),
00233| }),
00234| ```
00235| 
00236| ### 1.6 Add Audit Log Table
00237| 
00238| **File:** `packages/backend/convex/schema.ts`
00239| 
00240| ```typescript
00241| export const auditActionValidator = v.union(
00242|   v.literal("query"),
00243|   v.literal("mutation"),
00244|   v.literal("ai_tool_call"),
00245|   v.literal("login"),
00246|   v.literal("logout"),
00247|   v.literal("failed_auth"),
00248|   v.literal("permission_denied")
00249| );
00250| 
00251| auditLogs: defineTable({
00252|   userId: v.optional(v.string()), // null for anonymous/failed auth
00253|   action: auditActionValidator,
00254|   resource: v.string(), // Function name or resource type
00255|   resourceId: v.optional(v.string()), // Entity ID if applicable
00256|   
00257|   // Request details
00258|   args: v.optional(v.string()), // JSON stringified (sanitized)
00259|   result: v.optional(v.string()), // Success/failure/error message
00260|   
00261|   // Context
00262|   ipAddress: v.optional(v.string()),
00263|   userAgent: v.optional(v.string()),
00264|   sessionId: v.optional(v.string()),
00265|   
00266|   // AI-specific
00267|   aiThreadId: v.optional(v.string()),
00268|   aiToolName: v.optional(v.string()),
00269|   
00270|   // Timing
00271|   timestamp: v.number(),
00272|   durationMs: v.optional(v.number()),
00273| })
00274|   .index("by_user", ["userId"])
00275|   .index("by_action", ["action"])
00276|   .index("by_resource", ["resource"])
00277|   .index("by_timestamp", ["timestamp"])
00278|   .index("by_user_and_timestamp", ["userId", "timestamp"]),
00279| ```
00280| 
00281| ### 1.7 Terminal Configuration Updates
00282| 
00283| **File:** `packages/backend/convex/schema.ts`
00284| 
00285| ```typescript
00286| terminals: defineTable({
00287|   // Existing fields...
00288|   name: v.string(),
00289|   code: v.string(), // Used in booking reference prefix (TER1, TER2, etc.)
00290|   address: v.optional(v.string()),
00291|   timezone: v.string(),
00292|   isActive: v.boolean(),
00293|   
00294|   // NEW: Terminal-specific settings
00295|   autoValidationThreshold: v.optional(v.number()), // Overrides global if set
00296|   capacityAlertThresholds: v.optional(v.array(v.number())), // e.g., [70, 85, 95]
00297|   
00298|   // NEW: Operating hours (null = 24/7)
00299|   operatingHoursStart: v.optional(v.string()), // HH:mm
00300|   operatingHoursEnd: v.optional(v.string()), // HH:mm
00301|   
00302|   createdAt: v.number(),
00303|   updatedAt: v.number(),
00304|   createdBy: v.string(),
00305| })
00306| ```
00307| 
00308| ### Files to Create/Modify
00309| 
00310| | File | Action |
00311| |------|--------|
00312| | `packages/backend/convex/schema.ts` | Modify (major changes) |
00313| | `packages/backend/convex/lib/validators.ts` | Add new validators |
00314| | `packages/backend/convex/containers/` | Create new directory |
00315| | `packages/backend/convex/containers/queries.ts` | Create |
00316| | `packages/backend/convex/containers/mutations.ts` | Create |
00317| | `packages/backend/convex/audit/` | Create new directory |
00318| | `packages/backend/convex/audit/mutations.ts` | Create |
00319| | `packages/backend/convex/audit/queries.ts` | Create |
00320| 
00321| ---
00322| 
00323| ## Phase 2: Core Backend Functions Refactoring
00324| 
00325| **Duration:** 5-7 days  
00326| **Dependencies:** Phase 1
00327| 
00328| ### 2.1 Update Permissions System
00329| 
00330| **File:** `packages/backend/convex/lib/permissions.ts`
00331| 
00332| ```typescript
00333| // Update AuthenticatedUser type
00334| export type AuthenticatedUser = {
00335|   userId: UserId;
00336|   email: string;
00337|   name: string | undefined;
00338|   apcsRole: ApcsRole | null;
00339|   // Remove carrierCompanyId, add:
00340|   isCarrier: boolean;
00341| };
00342| 
00343| // Remove carrier company related functions
00344| // Update canViewCarrier -> canViewCarrierUser
00345| // Update canManageCarrier -> canManageCarrierUser
00346| 
00347| export async function canManageTruck(
00348|   ctx: PermissionContext,
00349|   user: AuthenticatedUser,
00350|   truckId: Id<"trucks">
00351| ): Promise<boolean> {
00352|   const truck = await ctx.db.get(truckId);
00353|   if (!truck) return false;
00354|   
00355|   // Port admin can manage all
00356|   if (user.apcsRole === "port_admin") return true;
00357|   
00358|   // Carrier can only manage their own trucks
00359|   if (user.apcsRole === "carrier") {
00360|     return truck.ownerId === user.userId;
00361|   }
00362|   
00363|   return false;
00364| }
00365| ```
00366| 
00367| ### 2.2 Update Capacity Engine
00368| 
00369| **File:** `packages/backend/convex/lib/capacity.ts`
00370| 
00371| ```typescript
00372| /**
00373|  * Get terminal capacity for a time slot
00374|  * Now terminal-level instead of gate-level
00375|  */
00376| export async function getTerminalSlotCapacity(
00377|   ctx: QueryCtx,
00378|   terminalId: Id<"terminals">,
00379|   date: string,
00380|   startTime: string,
00381|   endTime: string
00382| ): Promise<{
00383|   available: number;
00384|   total: number;
00385|   booked: number;
00386|   autoValidationLimit: number;
00387|   pendingCount: number;
00388| }> {
00389|   // Find matching slot
00390|   const slot = await ctx.db
00391|     .query("timeSlots")
00392|     .withIndex("by_terminal_and_date", (q) =>
00393|       q.eq("terminalId", terminalId).eq("date", date)
00394|     )
00395|     .filter((q) =>
00396|       q.and(
00397|         q.eq(q.field("startTime"), startTime),
00398|         q.eq(q.field("endTime"), endTime)
00399|       )
00400|     )
00401|     .first();
00402| 
00403|   if (!slot) {
00404|     return { available: 0, total: 0, booked: 0, autoValidationLimit: 0, pendingCount: 0 };
00405|   }
00406| 
00407|   // Count pending bookings
00408|   const pendingBookings = await ctx.db
00409|     .query("bookings")
00410|     .withIndex("by_terminal_and_status", (q) =>
00411|       q.eq("terminalId", terminalId).eq("status", "pending")
00412|     )
00413|     .filter((q) =>
00414|       q.and(
00415|         q.eq(q.field("preferredDate"), date),
00416|         q.eq(q.field("preferredTimeStart"), startTime)
00417|       )
00418|     )
00419|     .collect();
00420| 
00421|   const autoValidationLimit = Math.floor(
00422|     (slot.maxCapacity * slot.autoValidationThreshold) / 100
00423|   );
00424| 
00425|   return {
00426|     available: Math.max(0, slot.maxCapacity - slot.currentBookings),
00427|     total: slot.maxCapacity,
00428|     booked: slot.currentBookings,
00429|     autoValidationLimit,
00430|     pendingCount: pendingBookings.length,
00431|   };
00432| }
00433| 
00434| /**
00435|  * Check if booking should be auto-validated
00436|  */
00437| export async function shouldAutoValidate(
00438|   ctx: QueryCtx,
00439|   terminalId: Id<"terminals">,
00440|   slotId: Id<"timeSlots">
00441| ): Promise<boolean> {
00442|   const slot = await ctx.db.get(slotId);
00443|   if (!slot) return false;
00444| 
00445|   // Get confirmed bookings count for this slot
00446|   const confirmedCount = await ctx.db
00447|     .query("bookings")
00448|     .withIndex("by_time_slot_and_status", (q) =>
00449|       q.eq("timeSlotId", slotId).eq("status", "confirmed")
00450|     )
00451|     .collect();
00452| 
00453|   const autoValidationLimit = Math.floor(
00454|     (slot.maxCapacity * slot.autoValidationThreshold) / 100
00455|   );
00456| 
00457|   return confirmedCount.length < autoValidationLimit;
00458| }
00459| ```
00460| 
00461| ### 2.3 Update Booking Mutations
00462| 
00463| **File:** `packages/backend/convex/bookings/mutations.ts`
00464| 
00465| Major changes:
00466| - Remove carrier company references
00467| - Add container selection
00468| - Implement auto-validation logic
00469| - Gate assignment at approval time
00470| - Generate terminal-prefixed references
00471| 
00472| ```typescript
00473| /**
00474|  * Generate booking reference with terminal prefix
00475|  * Format: TER1-BK-001234
00476|  */
00477| async function generateBookingReference(
00478|   ctx: MutationCtx,
00479|   terminalCode: string
00480| ): Promise<string> {
00481|   const today = new Date();
00482|   const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
00483|   
00484|   // Count bookings for this terminal today
00485|   const count = await ctx.db
00486|     .query("bookings")
00487|     .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId))
00488|     .filter((q) => 
00489|       q.gte(q.field("bookedAt"), new Date(today.setHours(0,0,0,0)).getTime())
00490|     )
00491|     .collect();
00492| 
00493|   const sequence = String(count.length + 1).padStart(6, "0");
00494|   return `${terminalCode}-BK-${sequence}`;
00495| }
00496| 
00497| /**
00498|  * Create booking (carrier only)
00499|  * One booking = one truck + multiple containers
00500|  */

(File has more lines. Use 'offset' parameter to read beyond line 500)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.6s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "limit": 500,
  "offset": 500
}
```

**Output:**
```
<file>
00501| export const create = mutation({
00502|   args: {
00503|     terminalId: v.id("terminals"),
00504|     truckId: v.id("trucks"),
00505|     containerIds: v.array(v.id("containers")),
00506|     preferredDate: v.string(),
00507|     preferredTimeStart: v.string(),
00508|     preferredTimeEnd: v.string(),
00509|     driverName: v.optional(v.string()),
00510|     driverPhone: v.optional(v.string()),
00511|     driverIdNumber: v.optional(v.string()),
00512|   },
00513|   returns: v.object({
00514|     bookingId: v.id("bookings"),
00515|     status: bookingStatusValidator,
00516|     wasAutoValidated: v.boolean(),
00517|   }),
00518|   handler: async (ctx, args) => {
00519|     const user = await getAuthenticatedUser(ctx);
00520|     requireRole(user, ["carrier"]);
00521| 
00522|     // Validate truck ownership
00523|     const truck = await ctx.db.get(args.truckId);
00524|     if (!truck || truck.ownerId !== user.userId) {
00525|       throw new ConvexError({
00526|         code: "FORBIDDEN",
00527|         message: "You can only book with your own trucks",
00528|       });
00529|     }
00530| 
00531|     // Validate containers
00532|     for (const containerId of args.containerIds) {
00533|       const container = await ctx.db.get(containerId);
00534|       if (!container || container.ownerId !== user.userId) {
00535|         throw new ConvexError({
00536|           code: "FORBIDDEN",
00537|           message: "You can only book your own containers",
00538|         });
00539|       }
00540|       if (container.bookingId) {
00541|         throw new ConvexError({
00542|           code: "INVALID_STATE",
00543|           message: `Container ${container.containerNumber} is already assigned to a booking`,
00544|         });
00545|       }
00546|     }
00547| 
00548|     // Check terminal capacity
00549|     const capacity = await getTerminalSlotCapacity(
00550|       ctx,
00551|       args.terminalId,
00552|       args.preferredDate,
00553|       args.preferredTimeStart,
00554|       args.preferredTimeEnd
00555|     );
00556| 
00557|     if (capacity.available <= 0) {
00558|       throw new ConvexError({
00559|         code: "CAPACITY_FULL",
00560|         message: "No capacity available for this time slot",
00561|       });
00562|     }
00563| 
00564|     // Determine if auto-validation applies
00565|     const slot = await ctx.db
00566|       .query("timeSlots")
00567|       .withIndex("by_terminal_and_date", (q) =>
00568|         q.eq("terminalId", args.terminalId).eq("date", args.preferredDate)
00569|       )
00570|       .filter((q) =>
00571|         q.and(
00572|           q.eq(q.field("startTime"), args.preferredTimeStart),
00573|           q.eq(q.field("endTime"), args.preferredTimeEnd)
00574|         )
00575|       )
00576|       .first();
00577| 
00578|     if (!slot) {
00579|       throw new ConvexError({
00580|         code: "NOT_FOUND",
00581|         message: "Time slot not found",
00582|       });
00583|     }
00584| 
00585|     const shouldAutoValidate = await shouldAutoValidate(ctx, args.terminalId, slot._id);
00586| 
00587|     const terminal = await ctx.db.get(args.terminalId);
00588|     const bookingReference = await generateBookingReference(ctx, terminal!.code);
00589|     const now = Date.now();
00590| 
00591|     const bookingId = await ctx.db.insert("bookings", {
00592|       terminalId: args.terminalId,
00593|       carrierId: user.userId,
00594|       truckId: args.truckId,
00595|       containerIds: args.containerIds,
00596|       bookingReference,
00597|       status: shouldAutoValidate ? "confirmed" : "pending",
00598|       wasAutoValidated: shouldAutoValidate,
00599|       preferredDate: args.preferredDate,
00600|       preferredTimeStart: args.preferredTimeStart,
00601|       preferredTimeEnd: args.preferredTimeEnd,
00602|       driverName: args.driverName?.trim(),
00603|       driverPhone: args.driverPhone?.trim(),
00604|       driverIdNumber: args.driverIdNumber?.trim(),
00605|       bookedAt: now,
00606|       confirmedAt: shouldAutoValidate ? now : undefined,
00607|       timeSlotId: slot._id,
00608|       createdBy: user.userId,
00609|       updatedAt: now,
00610|     });
00611| 
00612|     // Update containers
00613|     for (const containerId of args.containerIds) {
00614|       await ctx.db.patch(containerId, { bookingId, updatedAt: now });
00615|     }
00616| 
00617|     // Update slot capacity
00618|     await ctx.db.patch(slot._id, {
00619|       currentBookings: slot.currentBookings + 1,
00620|       updatedAt: now,
00621|     });
00622| 
00623|     // If auto-validated, assign gate and generate QR
00624|     if (shouldAutoValidate) {
00625|       await assignGateToBooking(ctx, bookingId, args.terminalId, slot._id);
00626|       await generateAndStoreQRCode(ctx, bookingId, bookingReference);
00627|     }
00628| 
00629|     return {
00630|       bookingId,
00631|       status: shouldAutoValidate ? "confirmed" : "pending",
00632|       wasAutoValidated: shouldAutoValidate,
00633|     };
00634|   },
00635| });
00636| ```
00637| 
00638| ### 2.4 Gate Assignment Logic
00639| 
00640| **File:** `packages/backend/convex/bookings/internal.ts`
00641| 
00642| ```typescript
00643| /**
00644|  * Assign an available gate to a booking
00645|  * Called at approval time (manual or auto)
00646|  */
00647| export async function assignGateToBooking(
00648|   ctx: MutationCtx,
00649|   bookingId: Id<"bookings">,
00650|   terminalId: Id<"terminals">,
00651|   timeSlotId: Id<"timeSlots">
00652| ): Promise<Id<"gates">> {
00653|   const booking = await ctx.db.get(bookingId);
00654|   const truck = await ctx.db.get(booking!.truckId);
00655|   
00656|   // Get all active gates for terminal
00657|   const gates = await ctx.db
00658|     .query("gates")
00659|     .withIndex("by_terminal_and_active", (q) =>
00660|       q.eq("terminalId", terminalId).eq("isActive", true)
00661|     )
00662|     .collect();
00663| 
00664|   // Filter gates compatible with truck
00665|   const compatibleGates = gates.filter((gate) =>
00666|     gate.allowedTruckTypes.includes(truck!.truckType) &&
00667|     gate.allowedTruckClasses.includes(truck!.truckClass)
00668|   );
00669| 
00670|   if (compatibleGates.length === 0) {
00671|     throw new ConvexError({
00672|       code: "NO_COMPATIBLE_GATE",
00673|       message: "No gates available that support this truck type",
00674|     });
00675|   }
00676| 
00677|   // Find gate with lowest current load for this slot
00678|   let selectedGate = compatibleGates[0];
00679|   let lowestLoad = Infinity;
00680| 
00681|   for (const gate of compatibleGates) {
00682|     const gateBookings = await ctx.db
00683|       .query("bookings")
00684|       .withIndex("by_gate", (q) => q.eq("gateId", gate._id))
00685|       .filter((q) =>
00686|         q.and(
00687|           q.eq(q.field("timeSlotId"), timeSlotId),
00688|           q.or(
00689|             q.eq(q.field("status"), "pending"),
00690|             q.eq(q.field("status"), "confirmed")
00691|           )
00692|         )
00693|       )
00694|       .collect();
00695| 
00696|     if (gateBookings.length < lowestLoad) {
00697|       lowestLoad = gateBookings.length;
00698|       selectedGate = gate;
00699|     }
00700|   }
00701| 
00702|   await ctx.db.patch(bookingId, {
00703|     gateId: selectedGate._id,
00704|     updatedAt: Date.now(),
00705|   });
00706| 
00707|   return selectedGate._id;
00708| }
00709| ```
00710| 
00711| ### Files to Create/Modify
00712| 
00713| | File | Action |
00714| |------|--------|
00715| | `packages/backend/convex/lib/permissions.ts` | Modify |
00716| | `packages/backend/convex/lib/capacity.ts` | Major refactor |
00717| | `packages/backend/convex/bookings/mutations.ts` | Major refactor |
00718| | `packages/backend/convex/bookings/queries.ts` | Modify |
00719| | `packages/backend/convex/bookings/internal.ts` | Major refactor |
00720| | `packages/backend/convex/trucks/mutations.ts` | Modify (remove carrier company) |
00721| | `packages/backend/convex/trucks/queries.ts` | Modify |
00722| | `packages/backend/convex/containers/mutations.ts` | Create |
00723| | `packages/backend/convex/containers/queries.ts` | Create |
00724| 
00725| ---
00726| 
00727| ## Phase 3: AI Tools and Conversational Flows
00728| 
00729| **Duration:** 7-10 days  
00730| **Dependencies:** Phase 1, Phase 2
00731| 
00732| ### 3.1 Update Agent Configuration (French-only)
00733| 
00734| **File:** `packages/backend/convex/ai/agent.ts`
00735| 
00736| ```typescript
00737| export const apcsAgent = new Agent(components.agent, {
00738|   name: "Assistant APCS",
00739|   languageModel: google("gemini-2.0-flash"),
00740|   instructions: `Tu es l'assistant du système APCS (Advanced Port Container System).
00741| Tu aides les utilisateurs à gérer les opérations portuaires, les réservations de camions et la logistique.
00742| 
00743| IMPORTANT: Tu dois TOUJOURS répondre en français, quelle que soit la langue de l'utilisateur.
00744| 
00745| Informations clés:
00746| - Le système gère des terminaux, chacun avec des créneaux horaires pour les réservations de camions.
00747| - Il y a trois rôles: port_admin (administrateur portuaire), terminal_operator (opérateur terminal), carrier (transporteur).
00748| - Les réservations suivent un cycle: en attente → confirmée/rejetée → consommée/annulée/expirée.
00749| - Une réservation = un camion + plusieurs conteneurs.
00750| - La capacité est gérée au niveau du terminal (nombre de camions par créneau).
00751| - Les premiers N% de créneaux sont auto-validés (N configurable par admin).
00752| 
00753| Pour les transporteurs (carriers):
00754| - Guide-les dans le processus de réservation étape par étape.
00755| - Demande d'abord les conteneurs à transporter.
00756| - Suggère les créneaux optimaux (équilibrage de charge, urgence, temps d'attente minimal).
00757| - Affiche les widgets de données intégrés pour visualiser les informations.
00758| 
00759| Guidelines:
00760| - Utilise TOUJOURS les outils disponibles pour obtenir des données réelles. Ne jamais inventer d'informations.
00761| - Présente les données de manière structurée et claire.
00762| - Si l'utilisateur demande quelque chose hors de tes capacités, informe-le poliment.
00763| - Si un outil retourne ACCESS_DENIED, explique que le rôle de l'utilisateur ne permet pas cette action.
00764| - Sois concis mais complet.`,
00765|   tools: ALL_TOOLS,
00766|   maxSteps: 10,
00767| });
00768| ```
00769| 
00770| ### 3.2 New AI Tools for Carriers
00771| 
00772| **File:** `packages/backend/convex/ai/tools/containers.ts`
00773| 
00774| ```typescript
00775| /**
00776|  * List carrier's containers
00777|  * Widget: <ContainerList />
00778|  */
00779| export const listMyContainers = createTool({
00780|   description:
00781|     "Liste les conteneurs du transporteur. " +
00782|     "Peut filtrer par type, opération (enlèvement/dépôt), ou disponibilité.",
00783|   args: z.object({
00784|     operationType: z.enum(["pick_up", "drop_off"]).optional()
00785|       .describe("Filtrer par type d'opération"),
00786|     available: z.boolean().optional()
00787|       .describe("Uniquement les conteneurs non assignés"),
00788|     limit: z.number().optional()
00789|       .describe("Nombre maximum de résultats (défaut 50)"),
00790|   }),
00791|   handler: async (ctx, args): Promise<unknown> => {
00792|     const denied = await checkToolAccess(ctx, "listMyContainers");
00793|     if (denied) return denied;
00794| 
00795|     return await ctx.runQuery(
00796|       internal.ai.internalQueries.listMyContainers,
00797|       {
00798|         userId: ctx.userId!,
00799|         operationType: args.operationType,
00800|         available: args.available ?? true,
00801|         limit: args.limit ?? 50,
00802|       },
00803|     );
00804|   },
00805| });
00806| 
00807| /**
00808|  * Select containers for booking
00809|  * Widget: <ContainerSelector />
00810|  */
00811| export const selectContainersForBooking = createTool({
00812|   description:
00813|     "Permet de sélectionner des conteneurs pour une réservation. " +
00814|     "Retourne un widget de sélection interactif.",
00815|   args: z.object({
00816|     containerIds: z.array(z.string())
00817|       .describe("IDs des conteneurs à sélectionner"),
00818|   }),
00819|   handler: async (ctx, args): Promise<unknown> => {
00820|     const denied = await checkToolAccess(ctx, "selectContainersForBooking");
00821|     if (denied) return denied;
00822| 
00823|     // Validate containers belong to user and are available
00824|     return await ctx.runQuery(
00825|       internal.ai.internalQueries.validateContainerSelection,
00826|       {
00827|         userId: ctx.userId!,
00828|         containerIds: args.containerIds,
00829|       },
00830|     );
00831|   },
00832| });
00833| ```
00834| 
00835| **File:** `packages/backend/convex/ai/tools/slots.ts`
00836| 
00837| ```typescript
00838| /**
00839|  * Get optimal slot suggestions
00840|  * Uses load balancing + urgency + wait time optimization
00841|  * Widget: <SlotSuggestions />
00842|  */
00843| export const suggestOptimalSlots = createTool({
00844|   description:
00845|     "Suggère les créneaux horaires optimaux pour une réservation. " +
00846|     "Prend en compte: équilibrage de charge, urgence des conteneurs, temps d'attente minimal. " +
00847|     "Retourne les 5 meilleurs créneaux avec scores.",
00848|   args: z.object({
00849|     terminalId: z.string().describe("ID du terminal"),
00850|     containerIds: z.array(z.string())
00851|       .describe("IDs des conteneurs à transporter"),
00852|     preferredDate: z.string().optional()
00853|       .describe("Date préférée (YYYY-MM-DD)"),
00854|   }),
00855|   handler: async (ctx, args): Promise<unknown> => {
00856|     const denied = await checkToolAccess(ctx, "suggestOptimalSlots");
00857|     if (denied) return denied;
00858| 
00859|     return await ctx.runQuery(
00860|       internal.ai.internalQueries.suggestOptimalSlots,
00861|       {
00862|         userId: ctx.userId!,
00863|         terminalId: args.terminalId,
00864|         containerIds: args.containerIds,
00865|         preferredDate: args.preferredDate,
00866|       },
00867|     );
00868|   },
00869| });
00870| 
00871| /**
00872|  * Get slot availability for a terminal
00873|  * Widget: <SlotCalendar />
00874|  */
00875| export const getSlotAvailability = createTool({
00876|   description:
00877|     "Affiche la disponibilité des créneaux pour un terminal sur une période. " +
00878|     "Montre la capacité totale, réservée, et disponible par créneau.",
00879|   args: z.object({
00880|     terminalId: z.string().describe("ID du terminal"),
00881|     startDate: z.string().describe("Date de début (YYYY-MM-DD)"),
00882|     endDate: z.string().describe("Date de fin (YYYY-MM-DD)"),
00883|   }),
00884|   handler: async (ctx, args): Promise<unknown> => {
00885|     const denied = await checkToolAccess(ctx, "getSlotAvailability");
00886|     if (denied) return denied;
00887| 
00888|     return await ctx.runQuery(
00889|       internal.ai.internalQueries.getSlotAvailability,
00890|       {
00891|         userId: ctx.userId!,
00892|         terminalId: args.terminalId,
00893|         startDate: args.startDate,
00894|         endDate: args.endDate,
00895|       },
00896|     );
00897|   },
00898| });
00899| ```
00900| 
00901| **File:** `packages/backend/convex/ai/tools/booking-flow.ts`
00902| 
00903| ```typescript
00904| /**
00905|  * Create booking via AI (mutation tool)
00906|  * Widget: <BookingConfirmationCard />
00907|  */
00908| export const createBookingViaAI = createTool({
00909|   description:
00910|     "Crée une réservation. Requiert: terminal, camion, conteneurs, créneau. " +
00911|     "Retourne une carte de confirmation avec statut (auto-validé ou en attente).",
00912|   args: z.object({
00913|     terminalId: z.string().describe("ID du terminal"),
00914|     truckId: z.string().describe("ID du camion"),
00915|     containerIds: z.array(z.string()).describe("IDs des conteneurs"),
00916|     slotDate: z.string().describe("Date du créneau (YYYY-MM-DD)"),
00917|     slotStartTime: z.string().describe("Heure de début (HH:mm)"),
00918|     slotEndTime: z.string().describe("Heure de fin (HH:mm)"),
00919|     driverName: z.string().optional(),
00920|     driverPhone: z.string().optional(),
00921|   }),
00922|   handler: async (ctx, args): Promise<unknown> => {
00923|     const denied = await checkToolAccess(ctx, "createBookingViaAI");
00924|     if (denied) return denied;
00925| 
00926|     return await ctx.runMutation(
00927|       internal.ai.mutations.createBooking,
00928|       {
00929|         userId: ctx.userId!,
00930|         terminalId: args.terminalId as Id<"terminals">,
00931|         truckId: args.truckId as Id<"trucks">,
00932|         containerIds: args.containerIds as Id<"containers">[],
00933|         slotDate: args.slotDate,
00934|         slotStartTime: args.slotStartTime,
00935|         slotEndTime: args.slotEndTime,
00936|         driverName: args.driverName,
00937|         driverPhone: args.driverPhone,
00938|       },
00939|     );
00940|   },
00941| });
00942| 
00943| /**
00944|  * Cancel booking via AI
00945|  */
00946| export const cancelBookingViaAI = createTool({
00947|   description:
00948|     "Annule une réservation existante. " +
00949|     "Le transporteur peut annuler ses propres réservations à tout moment.",
00950|   args: z.object({
00951|     bookingReference: z.string()
00952|       .describe("Référence de la réservation (ex: TER1-BK-001234)"),
00953|     reason: z.string().optional()
00954|       .describe("Raison de l'annulation"),
00955|   }),
00956|   handler: async (ctx, args): Promise<unknown> => {
00957|     const denied = await checkToolAccess(ctx, "cancelBookingViaAI");
00958|     if (denied) return denied;
00959| 
00960|     return await ctx.runMutation(
00961|       internal.ai.mutations.cancelBooking,
00962|       {
00963|         userId: ctx.userId!,
00964|         bookingReference: args.bookingReference,
00965|         reason: args.reason,
00966|       },
00967|     );
00968|   },
00969| });
00970| ```
00971| 
00972| ### 3.3 Update Tool Registry
00973| 
00974| **File:** `packages/backend/convex/ai/registry.ts`
00975| 
00976| ```typescript
00977| import {
00978|   listMyBookings,
00979|   getBookingDetails,
00980|   listBookingsByTerminal,
00981|   listPendingBookings,
00982| } from "./tools/bookings";
00983| import {
00984|   listTerminals,
00985|   getTerminalDetails,
00986| } from "./tools/terminals";
00987| import {
00988|   listMyContainers,
00989|   selectContainersForBooking,
00990| } from "./tools/containers";
00991| import {
00992|   suggestOptimalSlots,
00993|   getSlotAvailability,
00994| } from "./tools/slots";
00995| import {
00996|   createBookingViaAI,
00997|   cancelBookingViaAI,
00998|   changeTruckViaAI,
00999| } from "./tools/booking-flow";
01000| import {

(File has more lines. Use 'offset' parameter to read beyond line 1000)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.7s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "limit": 500,
  "offset": 1000
}
```

**Output:**
```
<file>
01001|   listMyTrucks,
01002| } from "./tools/trucks";
01003| import { getSystemConfig } from "./tools/config";
01004| 
01005| export const ALL_TOOLS = {
01006|   // Queries
01007|   listMyBookings,
01008|   getBookingDetails,
01009|   listBookingsByTerminal,
01010|   listPendingBookings,
01011|   listTerminals,
01012|   getTerminalDetails,
01013|   listMyContainers,
01014|   listMyTrucks,
01015|   selectContainersForBooking,
01016|   suggestOptimalSlots,
01017|   getSlotAvailability,
01018|   getSystemConfig,
01019|   
01020|   // Mutations
01021|   createBookingViaAI,
01022|   cancelBookingViaAI,
01023|   changeTruckViaAI,
01024| } as const;
01025| ```
01026| 
01027| ### 3.4 Update Tool Permissions
01028| 
01029| **File:** `packages/backend/convex/ai/tools/types.ts`
01030| 
01031| ```typescript
01032| export const TOOL_PERMISSIONS: Record<ApcsRole, ToolName[]> = {
01033|   carrier: [
01034|     "listMyBookings",
01035|     "getBookingDetails",
01036|     "listTerminals",
01037|     "getTerminalDetails",
01038|     "listMyContainers",
01039|     "listMyTrucks",
01040|     "selectContainersForBooking",
01041|     "suggestOptimalSlots",
01042|     "getSlotAvailability",
01043|     "getSystemConfig",
01044|     "createBookingViaAI",
01045|     "cancelBookingViaAI",
01046|     "changeTruckViaAI",
01047|   ],
01048|   terminal_operator: [
01049|     "listBookingsByTerminal",
01050|     "listPendingBookings",
01051|     "getBookingDetails",
01052|     "listTerminals",
01053|     "getTerminalDetails",
01054|     "getSlotAvailability",
01055|     "getSystemConfig",
01056|   ],
01057|   port_admin: [
01058|     // All tools
01059|     "listMyBookings",
01060|     "getBookingDetails",
01061|     "listBookingsByTerminal",
01062|     "listPendingBookings",
01063|     "listTerminals",
01064|     "getTerminalDetails",
01065|     "listMyContainers",
01066|     "listMyTrucks",
01067|     "selectContainersForBooking",
01068|     "suggestOptimalSlots",
01069|     "getSlotAvailability",
01070|     "getSystemConfig",
01071|     "createBookingViaAI",
01072|     "cancelBookingViaAI",
01073|     "changeTruckViaAI",
01074|   ],
01075| };
01076| ```
01077| 
01078| ### 3.5 AI Chat Widget Components
01079| 
01080| **Files to create in:** `apps/web/src/components/ai-elements/apcs/`
01081| 
01082| | Component | Purpose |
01083| |-----------|---------|
01084| | `container-list.tsx` | Display carrier's containers |
01085| | `container-selector.tsx` | Interactive container selection |
01086| | `slot-suggestions.tsx` | Show optimal slot recommendations |
01087| | `slot-calendar.tsx` | Availability calendar view |
01088| | `booking-confirmation-card.tsx` | Booking result with status |
01089| | `truck-selector.tsx` | Truck selection for booking |
01090| | `booking-summary.tsx` | Expandable booking details |
01091| 
01092| ### Files to Create/Modify
01093| 
01094| | File | Action |
01095| |------|--------|
01096| | `packages/backend/convex/ai/agent.ts` | Modify (French instructions) |
01097| | `packages/backend/convex/ai/registry.ts` | Modify (add new tools) |
01098| | `packages/backend/convex/ai/tools/types.ts` | Modify (permissions) |
01099| | `packages/backend/convex/ai/tools/containers.ts` | Create |
01100| | `packages/backend/convex/ai/tools/slots.ts` | Create |
01101| | `packages/backend/convex/ai/tools/booking-flow.ts` | Create |
01102| | `packages/backend/convex/ai/tools/trucks.ts` | Create |
01103| | `packages/backend/convex/ai/mutations.ts` | Create |
01104| | `packages/backend/convex/ai/internalQueries.ts` | Major update |
01105| | `apps/web/src/components/ai-elements/apcs/*.tsx` | Create (7 files) |
01106| 
01107| ---
01108| 
01109| ## Phase 4: Time Slot Bulk Editing System
01110| 
01111| **Duration:** 4-5 days  
01112| **Dependencies:** Phase 1, Phase 2
01113| 
01114| ### 4.1 Bulk Edit Mutations
01115| 
01116| **File:** `packages/backend/convex/timeSlots/mutations.ts`
01117| 
01118| ```typescript
01119| /**
01120|  * Bulk create slots from a day template
01121|  * Copies one day's pattern to other days
01122|  */
01123| export const copyDayTemplate = mutation({
01124|   args: {
01125|     terminalId: v.id("terminals"),
01126|     sourceDate: v.string(), // Date to copy from
01127|     targetDates: v.array(v.string()), // Dates to copy to
01128|     skipExisting: v.boolean(),
01129|   },
01130|   returns: v.object({
01131|     created: v.number(),
01132|     skipped: v.number(),
01133|   }),
01134|   handler: async (ctx, args) => {
01135|     const user = await getAuthenticatedUser(ctx);
01136|     requireRole(user, ["port_admin", "terminal_operator"]);
01137|     await requireTerminalAccess(ctx, user, args.terminalId);
01138| 
01139|     // Get source day's slots
01140|     const sourceSlots = await ctx.db
01141|       .query("timeSlots")
01142|       .withIndex("by_terminal_and_date", (q) =>
01143|         q.eq("terminalId", args.terminalId).eq("date", args.sourceDate)
01144|       )
01145|       .filter((q) => q.eq(q.field("isActive"), true))
01146|       .collect();
01147| 
01148|     if (sourceSlots.length === 0) {
01149|       throw new ConvexError({
01150|         code: "NOT_FOUND",
01151|         message: "No slots found for source date",
01152|       });
01153|     }
01154| 
01155|     let created = 0;
01156|     let skipped = 0;
01157|     const now = Date.now();
01158| 
01159|     for (const targetDate of args.targetDates) {
01160|       if (args.skipExisting) {
01161|         const existing = await ctx.db
01162|           .query("timeSlots")
01163|           .withIndex("by_terminal_and_date", (q) =>
01164|             q.eq("terminalId", args.terminalId).eq("date", targetDate)
01165|           )
01166|           .first();
01167|         if (existing) {
01168|           skipped += sourceSlots.length;
01169|           continue;
01170|         }
01171|       }
01172| 
01173|       for (const slot of sourceSlots) {
01174|         await ctx.db.insert("timeSlots", {
01175|           terminalId: args.terminalId,
01176|           date: targetDate,
01177|           startTime: slot.startTime,
01178|           endTime: slot.endTime,
01179|           maxCapacity: slot.maxCapacity,
01180|           autoValidationThreshold: slot.autoValidationThreshold,
01181|           currentBookings: 0,
01182|           isActive: true,
01183|           createdAt: now,
01184|           updatedAt: now,
01185|           createdBy: user.userId,
01186|         });
01187|         created++;
01188|       }
01189|     }
01190| 
01191|     return { created, skipped };
01192|   },
01193| });
01194| 
01195| /**
01196|  * Create weekly recurring pattern
01197|  * Apply same slots for specific days of week
01198|  */
01199| export const createWeeklyPattern = mutation({
01200|   args: {
01201|     terminalId: v.id("terminals"),
01202|     startDate: v.string(),
01203|     endDate: v.string(),
01204|     daysOfWeek: v.array(v.number()), // 0=Sunday, 1=Monday, etc.
01205|     slots: v.array(v.object({
01206|       startTime: v.string(),
01207|       endTime: v.string(),
01208|       maxCapacity: v.number(),
01209|       autoValidationThreshold: v.number(),
01210|     })),
01211|     skipExisting: v.boolean(),
01212|   },
01213|   returns: v.object({
01214|     created: v.number(),
01215|     skipped: v.number(),
01216|   }),
01217|   handler: async (ctx, args) => {
01218|     const user = await getAuthenticatedUser(ctx);
01219|     requireRole(user, ["port_admin", "terminal_operator"]);
01220|     await requireTerminalAccess(ctx, user, args.terminalId);
01221| 
01222|     // Generate all dates in range that match daysOfWeek
01223|     const dates: string[] = [];
01224|     const current = new Date(args.startDate);
01225|     const end = new Date(args.endDate);
01226| 
01227|     while (current <= end) {
01228|       if (args.daysOfWeek.includes(current.getDay())) {
01229|         dates.push(current.toISOString().split("T")[0]);
01230|       }
01231|       current.setDate(current.getDate() + 1);
01232|     }
01233| 
01234|     let created = 0;
01235|     let skipped = 0;
01236|     const now = Date.now();
01237| 
01238|     for (const date of dates) {
01239|       if (args.skipExisting) {
01240|         const existing = await ctx.db
01241|           .query("timeSlots")
01242|           .withIndex("by_terminal_and_date", (q) =>
01243|             q.eq("terminalId", args.terminalId).eq("date", date)
01244|           )
01245|           .first();
01246|         if (existing) {
01247|           skipped += args.slots.length;
01248|           continue;
01249|         }
01250|       }
01251| 
01252|       for (const slotTemplate of args.slots) {
01253|         await ctx.db.insert("timeSlots", {
01254|           terminalId: args.terminalId,
01255|           date,
01256|           ...slotTemplate,
01257|           currentBookings: 0,
01258|           isActive: true,
01259|           createdAt: now,
01260|           updatedAt: now,
01261|           createdBy: user.userId,
01262|         });
01263|         created++;
01264|       }
01265|     }
01266| 
01267|     return { created, skipped };
01268|   },
01269| });
01270| 
01271| /**
01272|  * Bulk update capacity for multiple slots
01273|  */
01274| export const bulkUpdateCapacity = mutation({
01275|   args: {
01276|     terminalId: v.id("terminals"),
01277|     date: v.string(),
01278|     slotIds: v.optional(v.array(v.id("timeSlots"))), // If not provided, updates all on date
01279|     maxCapacity: v.number(),
01280|     autoValidationThreshold: v.optional(v.number()),
01281|   },
01282|   returns: v.number(), // Count of updated slots
01283|   handler: async (ctx, args) => {
01284|     const user = await getAuthenticatedUser(ctx);
01285|     requireRole(user, ["port_admin", "terminal_operator"]);
01286|     await requireTerminalAccess(ctx, user, args.terminalId);
01287| 
01288|     let slotsToUpdate;
01289|     
01290|     if (args.slotIds) {
01291|       slotsToUpdate = await Promise.all(
01292|         args.slotIds.map((id) => ctx.db.get(id))
01293|       );
01294|     } else {
01295|       slotsToUpdate = await ctx.db
01296|         .query("timeSlots")
01297|         .withIndex("by_terminal_and_date", (q) =>
01298|           q.eq("terminalId", args.terminalId).eq("date", args.date)
01299|         )
01300|         .collect();
01301|     }
01302| 
01303|     const now = Date.now();
01304|     let updated = 0;
01305| 
01306|     for (const slot of slotsToUpdate) {
01307|       if (!slot) continue;
01308|       
01309|       // Can't reduce below current bookings
01310|       if (args.maxCapacity < slot.currentBookings) {
01311|         continue;
01312|       }
01313| 
01314|       await ctx.db.patch(slot._id, {
01315|         maxCapacity: args.maxCapacity,
01316|         autoValidationThreshold: args.autoValidationThreshold ?? slot.autoValidationThreshold,
01317|         updatedAt: now,
01318|       });
01319|       updated++;
01320|     }
01321| 
01322|     return updated;
01323|   },
01324| });
01325| ```
01326| 
01327| ### 4.2 Slot Management UI Components
01328| 
01329| **Files to create in:** `apps/web/src/features/time-slots/`
01330| 
01331| | File | Purpose |
01332| |------|---------|
01333| | `components/slot-editor.tsx` | Individual slot editing |
01334| | `components/bulk-slot-editor.tsx` | Bulk editing interface |
01335| | `components/day-template-picker.tsx` | Copy day template modal |
01336| | `components/weekly-pattern-wizard.tsx` | Weekly pattern configuration |
01337| | `components/slot-calendar-view.tsx` | Calendar view of all slots |
01338| | `hooks/use-slot-editing.ts` | State management for editing |
01339| 
01340| ### Files to Create/Modify
01341| 
01342| | File | Action |
01343| |------|--------|
01344| | `packages/backend/convex/timeSlots/mutations.ts` | Major update |
01345| | `packages/backend/convex/timeSlots/queries.ts` | Add bulk queries |
01346| | `apps/web/src/features/time-slots/` | Create directory + 6 files |
01347| | `apps/web/src/routes/operator/slots.tsx` | Create |
01348| 
01349| ---
01350| 
01351| ## Phase 5: Auto-Validation and Booking Approval Workflows
01352| 
01353| **Duration:** 3-4 days  
01354| **Dependencies:** Phase 1, Phase 2, Phase 4
01355| 
01356| ### 5.1 Auto-Validation Engine
01357| 
01358| **File:** `packages/backend/convex/lib/autoValidation.ts`
01359| 
01360| ```typescript
01361| /**
01362|  * Auto-validation engine
01363|  * Determines if a booking should be auto-approved based on threshold
01364|  */
01365| 
01366| export interface AutoValidationResult {
01367|   shouldAutoValidate: boolean;
01368|   reason: string;
01369|   currentAutoValidatedCount: number;
01370|   autoValidationLimit: number;
01371|   thresholdPercent: number;
01372| }
01373| 
01374| export async function checkAutoValidation(
01375|   ctx: QueryCtx,
01376|   terminalId: Id<"terminals">,
01377|   slotId: Id<"timeSlots">
01378| ): Promise<AutoValidationResult> {
01379|   const slot = await ctx.db.get(slotId);
01380|   if (!slot) {
01381|     return {
01382|       shouldAutoValidate: false,
01383|       reason: "Créneau non trouvé",
01384|       currentAutoValidatedCount: 0,
01385|       autoValidationLimit: 0,
01386|       thresholdPercent: 0,
01387|     };
01388|   }
01389| 
01390|   // Get terminal for potential override
01391|   const terminal = await ctx.db.get(terminalId);
01392|   const thresholdPercent = terminal?.autoValidationThreshold ?? slot.autoValidationThreshold;
01393|   
01394|   const autoValidationLimit = Math.floor(
01395|     (slot.maxCapacity * thresholdPercent) / 100
01396|   );
01397| 
01398|   // Count current auto-validated bookings for this slot
01399|   const autoValidatedBookings = await ctx.db
01400|     .query("bookings")
01401|     .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slotId))
01402|     .filter((q) =>
01403|       q.and(
01404|         q.eq(q.field("wasAutoValidated"), true),
01405|         q.eq(q.field("status"), "confirmed")
01406|       )
01407|     )
01408|     .collect();
01409| 
01410|   const currentAutoValidatedCount = autoValidatedBookings.length;
01411|   const shouldAutoValidate = currentAutoValidatedCount < autoValidationLimit;
01412| 
01413|   return {
01414|     shouldAutoValidate,
01415|     reason: shouldAutoValidate
01416|       ? `Auto-validation disponible (${currentAutoValidatedCount}/${autoValidationLimit})`
01417|       : `Seuil atteint - validation manuelle requise (${currentAutoValidatedCount}/${autoValidationLimit})`,
01418|     currentAutoValidatedCount,
01419|     autoValidationLimit,
01420|     thresholdPercent,
01421|   };
01422| }
01423| ```
01424| 
01425| ### 5.2 Manual Approval Workflow
01426| 
01427| **File:** `packages/backend/convex/bookings/mutations.ts`
01428| 
01429| ```typescript
01430| /**
01431|  * Confirm a pending booking (terminal operator/admin)
01432|  * Assigns gate and generates QR code
01433|  */
01434| export const confirmBooking = mutation({
01435|   args: {
01436|     bookingId: v.id("bookings"),
01437|     gateId: v.optional(v.id("gates")), // If not provided, auto-assign
01438|     note: v.optional(v.string()),
01439|   },
01440|   returns: v.object({
01441|     success: v.boolean(),
01442|     gateAssigned: v.id("gates"),
01443|     qrCodeGenerated: v.boolean(),
01444|   }),
01445|   handler: async (ctx, args) => {
01446|     const user = await getAuthenticatedUser(ctx);
01447|     requireRole(user, ["port_admin", "terminal_operator"]);
01448| 
01449|     const booking = await ctx.db.get(args.bookingId);
01450|     if (!booking) {
01451|       throw new ConvexError({ code: "NOT_FOUND", message: "Réservation non trouvée" });
01452|     }
01453| 
01454|     await requireTerminalAccess(ctx, user, booking.terminalId);
01455| 
01456|     if (booking.status !== "pending") {
01457|       throw new ConvexError({
01458|         code: "INVALID_STATE",
01459|         message: `Impossible de confirmer une réservation avec le statut "${booking.status}"`,
01460|       });
01461|     }
01462| 
01463|     // Assign gate
01464|     let gateId: Id<"gates">;
01465|     if (args.gateId) {
01466|       // Validate specified gate
01467|       const gate = await ctx.db.get(args.gateId);
01468|       if (!gate || gate.terminalId !== booking.terminalId) {
01469|         throw new ConvexError({ code: "INVALID_INPUT", message: "Portail invalide" });
01470|       }
01471|       gateId = args.gateId;
01472|     } else {
01473|       // Auto-assign gate
01474|       gateId = await assignGateToBooking(ctx, args.bookingId, booking.terminalId, booking.timeSlotId!);
01475|     }
01476| 
01477|     const now = Date.now();
01478| 
01479|     // Update booking
01480|     await ctx.db.patch(args.bookingId, {
01481|       status: "confirmed",
01482|       gateId,
01483|       confirmedAt: now,
01484|       processedBy: user.userId,
01485|       updatedAt: now,
01486|     });
01487| 
01488|     // Generate QR code
01489|     await generateAndStoreQRCode(ctx, args.bookingId, booking.bookingReference);
01490| 
01491|     // Record history
01492|     await recordBookingHistory(ctx, args.bookingId, "status_changed", {
01493|       previousValue: "pending",
01494|       newValue: "confirmed",
01495|       note: args.note,
01496|       changedBy: user.userId,
01497|     });
01498| 
01499|     // Send notification
01500|     await scheduleNotification(ctx, {

(File has more lines. Use 'offset' parameter to read beyond line 1500)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.7s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "limit": 500,
  "offset": 1500
}
```

**Output:**
```
<file>
01501|       userId: booking.carrierId,
01502|       type: "booking_confirmed",
01503|       bookingId: args.bookingId,
01504|     });
01505| 
01506|     return {
01507|       success: true,
01508|       gateAssigned: gateId,
01509|       qrCodeGenerated: true,
01510|     };
01511|   },
01512| });
01513| ```
01514| 
01515| ### 5.3 Approval Queue UI
01516| 
01517| **Files to create in:** `apps/web/src/features/approvals/`
01518| 
01519| | File | Purpose |
01520| |------|---------|
01521| | `components/approval-queue.tsx` | List of pending bookings |
01522| | `components/approval-card.tsx` | Single booking approval UI |
01523| | `components/bulk-approval.tsx` | Approve multiple bookings |
01524| | `components/gate-assignment-modal.tsx` | Manual gate selection |
01525| | `hooks/use-approvals.ts` | Approval state management |
01526| 
01527| ### Files to Create/Modify
01528| 
01529| | File | Action |
01530| |------|--------|
01531| | `packages/backend/convex/lib/autoValidation.ts` | Create |
01532| | `packages/backend/convex/bookings/mutations.ts` | Update confirm logic |
01533| | `apps/web/src/features/approvals/` | Create directory + 5 files |
01534| | `apps/web/src/routes/operator/approvals.tsx` | Create |
01535| 
01536| ---
01537| 
01538| ## Phase 6: Notification System with Email Integration
01539| 
01540| **Duration:** 4-5 days  
01541| **Dependencies:** Phase 1, Phase 5
01542| 
01543| ### 6.1 Notification Service
01544| 
01545| **File:** `packages/backend/convex/notifications/service.ts`
01546| 
01547| ```typescript
01548| import { action } from "../_generated/server";
01549| import { internal } from "../_generated/api";
01550| import { v } from "convex/values";
01551| 
01552| // Notification templates (French)
01553| const NOTIFICATION_TEMPLATES = {
01554|   booking_created: {
01555|     titleFr: "Réservation créée",
01556|     bodyFr: "Votre réservation {reference} a été créée et est en attente de confirmation.",
01557|   },
01558|   booking_confirmed: {
01559|     titleFr: "Réservation confirmée",
01560|     bodyFr: "Votre réservation {reference} a été confirmée pour le {date} à {time}. Portail: {gate}.",
01561|   },
01562|   booking_rejected: {
01563|     titleFr: "Réservation refusée",
01564|     bodyFr: "Votre réservation {reference} a été refusée. Raison: {reason}",
01565|   },
01566|   booking_cancelled: {
01567|     titleFr: "Réservation annulée",
01568|     bodyFr: "Votre réservation {reference} a été annulée.",
01569|   },
01570|   booking_reminder: {
01571|     titleFr: "Rappel de réservation",
01572|     bodyFr: "Rappel: Votre réservation {reference} est prévue dans {hours} heures.",
01573|   },
01574|   capacity_alert: {
01575|     titleFr: "Alerte de capacité",
01576|     bodyFr: "Le terminal {terminal} atteint {percent}% de capacité pour le {date}.",
01577|   },
01578| };
01579| 
01580| /**
01581|  * Send notification (in-app + email)
01582|  */
01583| export const sendNotification = action({
01584|   args: {
01585|     userId: v.string(),
01586|     type: notificationTypeValidator,
01587|     data: v.object({
01588|       bookingId: v.optional(v.id("bookings")),
01589|       terminalId: v.optional(v.id("terminals")),
01590|       reference: v.optional(v.string()),
01591|       date: v.optional(v.string()),
01592|       time: v.optional(v.string()),
01593|       gate: v.optional(v.string()),
01594|       reason: v.optional(v.string()),
01595|       hours: v.optional(v.number()),
01596|       terminal: v.optional(v.string()),
01597|       percent: v.optional(v.number()),
01598|     }),
01599|   },
01600|   handler: async (ctx, args) => {
01601|     const template = NOTIFICATION_TEMPLATES[args.type];
01602|     
01603|     // Replace placeholders
01604|     let bodyFr = template.bodyFr;
01605|     for (const [key, value] of Object.entries(args.data)) {
01606|       if (value !== undefined) {
01607|         bodyFr = bodyFr.replace(`{${key}}`, String(value));
01608|       }
01609|     }
01610| 
01611|     // Get user preferences
01612|     const userProfile = await ctx.runQuery(internal.users.queries.getProfile, {
01613|       userId: args.userId,
01614|     });
01615| 
01616|     const channel = userProfile?.notificationChannel ?? "both";
01617| 
01618|     // Create in-app notification
01619|     const notificationId = await ctx.runMutation(
01620|       internal.notifications.internal.create,
01621|       {
01622|         userId: args.userId,
01623|         type: args.type,
01624|         channel,
01625|         titleFr: template.titleFr,
01626|         titleEn: template.titleFr, // French-only for now
01627|         bodyFr,
01628|         bodyEn: bodyFr,
01629|         relatedEntityType: args.data.bookingId ? "booking" : 
01630|                           args.data.terminalId ? "terminal" : undefined,
01631|         relatedEntityId: args.data.bookingId ?? args.data.terminalId,
01632|       }
01633|     );
01634| 
01635|     // Send email if enabled
01636|     if (channel === "email" || channel === "both") {
01637|       const user = await ctx.runQuery(internal.users.queries.getById, {
01638|         userId: args.userId,
01639|       });
01640| 
01641|       if (user?.email) {
01642|         await ctx.runAction(internal.email.sendEmail, {
01643|           to: user.email,
01644|           subject: template.titleFr,
01645|           body: bodyFr,
01646|           notificationId,
01647|         });
01648|       }
01649|     }
01650| 
01651|     return notificationId;
01652|   },
01653| });
01654| ```
01655| 
01656| ### 6.2 Email Service (Resend)
01657| 
01658| **File:** `packages/backend/convex/email/index.ts`
01659| 
01660| ```typescript
01661| "use node";
01662| import { action } from "../_generated/server";
01663| import { v } from "convex/values";
01664| import { Resend } from "resend";
01665| 
01666| const resend = new Resend(process.env.RESEND_API_KEY);
01667| 
01668| export const sendEmail = action({
01669|   args: {
01670|     to: v.string(),
01671|     subject: v.string(),
01672|     body: v.string(),
01673|     notificationId: v.optional(v.id("notifications")),
01674|   },
01675|   handler: async (ctx, args) => {
01676|     try {
01677|       const result = await resend.emails.send({
01678|         from: "APCS <noreply@apcs.port.com>",
01679|         to: args.to,
01680|         subject: `[APCS] ${args.subject}`,
01681|         html: `
01682|           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
01683|             <div style="background: #0066CC; color: white; padding: 20px; text-align: center;">
01684|               <h1>APCS - Port Booking System</h1>
01685|             </div>
01686|             <div style="padding: 20px; background: #f5f5f5;">
01687|               <p>${args.body}</p>
01688|             </div>
01689|             <div style="padding: 10px; text-align: center; color: #666; font-size: 12px;">
01690|               Ce message a été envoyé automatiquement par le système APCS.
01691|             </div>
01692|           </div>
01693|         `,
01694|       });
01695| 
01696|       // Update notification with email status
01697|       if (args.notificationId) {
01698|         await ctx.runMutation(internal.notifications.internal.markEmailSent, {
01699|           notificationId: args.notificationId,
01700|           success: true,
01701|         });
01702|       }
01703| 
01704|       return { success: true, id: result.id };
01705|     } catch (error) {
01706|       // Log error and update notification
01707|       if (args.notificationId) {
01708|         await ctx.runMutation(internal.notifications.internal.markEmailSent, {
01709|           notificationId: args.notificationId,
01710|           success: false,
01711|           error: String(error),
01712|         });
01713|       }
01714|       throw error;
01715|     }
01716|   },
01717| });
01718| ```
01719| 
01720| ### 6.3 Capacity Alert System
01721| 
01722| **File:** `packages/backend/convex/scheduled.ts`
01723| 
01724| ```typescript
01725| /**
01726|  * Check capacity thresholds and send alerts
01727|  * Called by cron job
01728|  */
01729| export const checkCapacityAlerts = internalMutation({
01730|   args: {},
01731|   handler: async (ctx) => {
01732|     // Get all terminals with alert thresholds
01733|     const terminals = await ctx.db
01734|       .query("terminals")
01735|       .filter((q) => q.eq(q.field("isActive"), true))
01736|       .collect();
01737| 
01738|     const tomorrow = new Date();
01739|     tomorrow.setDate(tomorrow.getDate() + 1);
01740|     const tomorrowStr = tomorrow.toISOString().split("T")[0];
01741| 
01742|     for (const terminal of terminals) {
01743|       if (!terminal.capacityAlertThresholds?.length) continue;
01744| 
01745|       // Get tomorrow's slots
01746|       const slots = await ctx.db
01747|         .query("timeSlots")
01748|         .withIndex("by_terminal_and_date", (q) =>
01749|           q.eq("terminalId", terminal._id).eq("date", tomorrowStr)
01750|         )
01751|         .collect();
01752| 
01753|       for (const slot of slots) {
01754|         const utilization = Math.round(
01755|           (slot.currentBookings / slot.maxCapacity) * 100
01756|         );
01757| 
01758|         // Check if utilization crosses any threshold
01759|         for (const threshold of terminal.capacityAlertThresholds) {
01760|           if (utilization >= threshold) {
01761|             // Send alert to all terminal operators
01762|             const operators = await ctx.db
01763|               .query("terminalOperatorAssignments")
01764|               .withIndex("by_terminal_and_active", (q) =>
01765|                 q.eq("terminalId", terminal._id).eq("isActive", true)
01766|               )
01767|               .collect();
01768| 
01769|             for (const op of operators) {
01770|               await ctx.scheduler.runAfter(0, internal.notifications.service.sendNotification, {
01771|                 userId: op.userId,
01772|                 type: "capacity_alert",
01773|                 data: {
01774|                   terminalId: terminal._id,
01775|                   terminal: terminal.name,
01776|                   date: tomorrowStr,
01777|                   percent: utilization,
01778|                 },
01779|               });
01780|             }
01781|             break; // Only send one alert per slot
01782|           }
01783|         }
01784|       }
01785|     }
01786|   },
01787| });
01788| ```
01789| 
01790| ### Files to Create/Modify
01791| 
01792| | File | Action |
01793| |------|--------|
01794| | `packages/backend/convex/notifications/service.ts` | Create |
01795| | `packages/backend/convex/notifications/internal.ts` | Update |
01796| | `packages/backend/convex/email/index.ts` | Create |
01797| | `packages/backend/convex/scheduled.ts` | Update |
01798| | `packages/backend/convex/crons.ts` | Update |
01799| 
01800| ---
01801| 
01802| ## Phase 7: QR Code Generation and Scanning
01803| 
01804| **Duration:** 3-4 days  
01805| **Dependencies:** Phase 5
01806| 
01807| ### 7.1 QR Code Generation
01808| 
01809| **File:** `packages/backend/convex/qr/index.ts`
01810| 
01811| ```typescript
01812| "use node";
01813| import { action, internalMutation } from "../_generated/server";
01814| import { v } from "convex/values";
01815| import QRCode from "qrcode";
01816| 
01817| /**
01818|  * Generate QR code for a booking
01819|  * Contains only the booking reference (lookup required)
01820|  */
01821| export const generateQRCode = action({
01822|   args: {
01823|     bookingId: v.id("bookings"),
01824|     bookingReference: v.string(),
01825|   },
01826|   returns: v.object({
01827|     storageId: v.id("_storage"),
01828|     dataUrl: v.string(),
01829|   }),
01830|   handler: async (ctx, args) => {
01831|     // Generate QR code with only the reference
01832|     const qrData = JSON.stringify({
01833|       ref: args.bookingReference,
01834|       type: "APCS_BOOKING",
01835|     });
01836| 
01837|     // Generate as PNG buffer
01838|     const buffer = await QRCode.toBuffer(qrData, {
01839|       type: "png",
01840|       width: 400,
01841|       margin: 2,
01842|       color: {
01843|         dark: "#000000",
01844|         light: "#FFFFFF",
01845|       },
01846|     });
01847| 
01848|     // Store in Convex file storage
01849|     const blob = new Blob([buffer], { type: "image/png" });
01850|     const storageId = await ctx.storage.store(blob);
01851| 
01852|     // Also generate data URL for immediate display
01853|     const dataUrl = await QRCode.toDataURL(qrData, {
01854|       width: 200,
01855|       margin: 1,
01856|     });
01857| 
01858|     // Update booking with QR code info
01859|     await ctx.runMutation(internal.qr.updateBookingQR, {
01860|       bookingId: args.bookingId,
01861|       storageId,
01862|       dataUrl,
01863|     });
01864| 
01865|     return { storageId, dataUrl };
01866|   },
01867| });
01868| 
01869| export const updateBookingQR = internalMutation({
01870|   args: {
01871|     bookingId: v.id("bookings"),
01872|     storageId: v.id("_storage"),
01873|     dataUrl: v.string(),
01874|   },
01875|   handler: async (ctx, args) => {
01876|     await ctx.db.patch(args.bookingId, {
01877|       qrCodeStorageId: args.storageId,
01878|       qrCode: args.dataUrl,
01879|       updatedAt: Date.now(),
01880|     });
01881|   },
01882| });
01883| ```
01884| 
01885| ### 7.2 QR Code Scanning (Entry/Exit)
01886| 
01887| **File:** `packages/backend/convex/qr/scan.ts`
01888| 
01889| ```typescript
01890| /**
01891|  * Process QR code scan
01892|  * Double scan: entry + exit
01893|  */
01894| export const processScan = mutation({
01895|   args: {
01896|     qrData: v.string(), // Raw QR data
01897|     scanType: v.union(v.literal("entry"), v.literal("exit")),
01898|     gateId: v.id("gates"),
01899|   },
01900|   returns: v.object({
01901|     success: v.boolean(),
01902|     booking: v.optional(v.object({
01903|       reference: v.string(),
01904|       status: v.string(),
01905|       truckLicensePlate: v.string(),
01906|       driverName: v.optional(v.string()),
01907|       containerCount: v.number(),
01908|     })),
01909|     error: v.optional(v.string()),
01910|   }),
01911|   handler: async (ctx, args) => {
01912|     const user = await getAuthenticatedUser(ctx);
01913|     requireRole(user, ["port_admin", "terminal_operator"]);
01914| 
01915|     // Parse QR data
01916|     let qrPayload: { ref: string; type: string };
01917|     try {
01918|       qrPayload = JSON.parse(args.qrData);
01919|       if (qrPayload.type !== "APCS_BOOKING") {
01920|         return { success: false, error: "Code QR invalide" };
01921|       }
01922|     } catch {
01923|       return { success: false, error: "Impossible de lire le code QR" };
01924|     }
01925| 
01926|     // Find booking by reference
01927|     const booking = await ctx.db
01928|       .query("bookings")
01929|       .withIndex("by_reference", (q) => q.eq("bookingReference", qrPayload.ref))
01930|       .unique();
01931| 
01932|     if (!booking) {
01933|       return { success: false, error: "Réservation non trouvée" };
01934|     }
01935| 
01936|     // Verify gate access
01937|     const gate = await ctx.db.get(args.gateId);
01938|     if (!gate || gate.terminalId !== booking.terminalId) {
01939|       return { success: false, error: "Portail non autorisé pour cette réservation" };
01940|     }
01941| 
01942|     await requireTerminalAccess(ctx, user, booking.terminalId);
01943| 
01944|     const truck = await ctx.db.get(booking.truckId);
01945|     const now = Date.now();
01946| 
01947|     if (args.scanType === "entry") {
01948|       // Entry scan
01949|       if (booking.status !== "confirmed") {
01950|         return { success: false, error: `Statut invalide: ${booking.status}` };
01951|       }
01952| 
01953|       if (booking.entryScannedAt) {
01954|         return { success: false, error: "Entrée déjà enregistrée" };
01955|       }
01956| 
01957|       await ctx.db.patch(booking._id, {
01958|         entryScannedAt: now,
01959|         entryScannedBy: user.userId,
01960|         status: "consumed",
01961|         consumedAt: now,
01962|         updatedAt: now,
01963|       });
01964| 
01965|       await recordBookingHistory(ctx, booking._id, "status_changed", {
01966|         previousValue: "confirmed",
01967|         newValue: "consumed",
01968|         note: `Entrée scannée au portail ${gate.code}`,
01969|         changedBy: user.userId,
01970|       });
01971| 
01972|     } else {
01973|       // Exit scan
01974|       if (booking.status !== "consumed") {
01975|         return { success: false, error: `Le véhicule doit d'abord entrer` };
01976|       }
01977| 
01978|       if (booking.exitScannedAt) {
01979|         return { success: false, error: "Sortie déjà enregistrée" };
01980|       }
01981| 
01982|       await ctx.db.patch(booking._id, {
01983|         exitScannedAt: now,
01984|         exitScannedBy: user.userId,
01985|         updatedAt: now,
01986|       });
01987| 
01988|       await recordBookingHistory(ctx, booking._id, "details_updated", {
01989|         previousValue: "entry only",
01990|         newValue: "entry + exit",
01991|         note: `Sortie scannée au portail ${gate.code}`,
01992|         changedBy: user.userId,
01993|       });
01994|     }
01995| 
01996|     return {
01997|       success: true,
01998|       booking: {
01999|         reference: booking.bookingReference,
02000|         status: args.scanType === "entry" ? "consumed" : booking.status,

(File has more lines. Use 'offset' parameter to read beyond line 2000)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 6.0s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "limit": 500,
  "offset": 2000
}
```

**Output:**
```
<file>
02001|         truckLicensePlate: truck?.licensePlate ?? "N/A",
02002|         driverName: booking.driverName,
02003|         containerCount: booking.containerIds.length,
02004|       },
02005|     };
02006|   },
02007| });
02008| ```
02009| 
02010| ### 7.3 Scanner UI Component
02011| 
02012| **File:** `apps/web/src/features/scanner/components/qr-scanner.tsx`
02013| 
02014| ```typescript
02015| // Uses react-qr-reader or similar library
02016| // Displays scan result with booking details
02017| // Shows different UI for entry vs exit mode
02018| ```
02019| 
02020| ### Files to Create/Modify
02021| 
02022| | File | Action |
02023| |------|--------|
02024| | `packages/backend/convex/qr/index.ts` | Create |
02025| | `packages/backend/convex/qr/scan.ts` | Create |
02026| | `apps/web/src/features/scanner/` | Create directory |
02027| | `apps/web/src/features/scanner/components/qr-scanner.tsx` | Create |
02028| | `apps/web/src/features/scanner/components/scan-result.tsx` | Create |
02029| | `apps/web/src/routes/operator/scanner.tsx` | Create |
02030| 
02031| ---
02032| 
02033| ## Phase 8: Dashboard UI Components
02034| 
02035| **Duration:** 5-7 days  
02036| **Dependencies:** Phase 1-7
02037| 
02038| ### 8.1 Dashboard Layout with Chat Sidebar
02039| 
02040| **File:** `apps/web/src/layouts/dashboard-layout.tsx`
02041| 
02042| ```typescript
02043| export function DashboardLayout({ children }: { children: React.ReactNode }) {
02044|   const [isChatOpen, setIsChatOpen] = useState(true);
02045| 
02046|   return (
02047|     <div className="flex h-screen">
02048|       {/* Main sidebar (navigation) */}
02049|       <DashboardSidebar />
02050|       
02051|       {/* Main content */}
02052|       <main className="flex-1 overflow-auto">
02053|         {children}
02054|       </main>
02055| 
02056|       {/* Chat sidebar (closeable) */}
02057|       <ChatSidebar 
02058|         isOpen={isChatOpen} 
02059|         onToggle={() => setIsChatOpen(!isChatOpen)} 
02060|       />
02061|     </div>
02062|   );
02063| }
02064| ```
02065| 
02066| ### 8.2 Role-Specific Dashboards
02067| 
02068| **Files to create:**
02069| 
02070| | File | Role | Purpose |
02071| |------|------|---------|
02072| | `apps/web/src/routes/admin/dashboard.tsx` | port_admin | Global overview, system config |
02073| | `apps/web/src/routes/operator/dashboard.tsx` | terminal_operator | Terminal-specific metrics |
02074| | `apps/web/src/routes/carrier/dashboard.tsx` | carrier | Personal bookings, trucks, containers |
02075| 
02076| ### 8.3 Dashboard Components
02077| 
02078| **Files in:** `apps/web/src/features/dashboard/`
02079| 
02080| | Component | Purpose |
02081| |-----------|---------|
02082| | `components/stats-card.tsx` | Metric card with trend |
02083| | `components/booking-chart.tsx` | Booking trends chart |
02084| | `components/capacity-gauge.tsx` | Terminal capacity gauge |
02085| | `components/recent-activity.tsx` | Activity feed |
02086| | `components/pending-actions.tsx` | Actions needing attention |
02087| | `components/terminal-overview.tsx` | Terminal status grid |
02088| | `components/date-range-picker.tsx` | Custom date range selection |
02089| | `components/export-button.tsx` | CSV/PDF export |
02090| 
02091| ### Files to Create/Modify
02092| 
02093| | File | Action |
02094| |------|--------|
02095| | `apps/web/src/layouts/dashboard-layout.tsx` | Create |
02096| | `apps/web/src/components/chat-sidebar.tsx` | Create |
02097| | `apps/web/src/routes/admin/dashboard.tsx` | Create |
02098| | `apps/web/src/routes/operator/dashboard.tsx` | Create |
02099| | `apps/web/src/routes/carrier/dashboard.tsx` | Create |
02100| | `apps/web/src/features/dashboard/` | Create directory + 8 components |
02101| 
02102| ---
02103| 
02104| ## Phase 9: Analytics with Aggregations
02105| 
02106| **Duration:** 5-7 days  
02107| **Dependencies:** Phase 8
02108| 
02109| ### 9.1 Analytics Tables (Convex Aggregate Component)
02110| 
02111| **File:** `packages/backend/convex/analytics/schema.ts`
02112| 
02113| ```typescript
02114| // Pre-computed aggregates for performance
02115| bookingAggregates: defineTable({
02116|   terminalId: v.id("terminals"),
02117|   date: v.string(), // YYYY-MM-DD
02118|   hour: v.optional(v.number()), // 0-23 for hourly, null for daily
02119|   
02120|   // Counts
02121|   totalBookings: v.number(),
02122|   pendingCount: v.number(),
02123|   confirmedCount: v.number(),
02124|   rejectedCount: v.number(),
02125|   consumedCount: v.number(),
02126|   cancelledCount: v.number(),
02127|   expiredCount: v.number(),
02128|   autoValidatedCount: v.number(),
02129|   
02130|   // Capacity metrics
02131|   avgCapacityUtilization: v.number(), // 0-100
02132|   peakUtilization: v.number(),
02133|   
02134|   // Container metrics
02135|   totalContainers: v.number(),
02136|   pickupContainers: v.number(),
02137|   dropoffContainers: v.number(),
02138|   
02139|   // Timing
02140|   avgWaitTimeMinutes: v.optional(v.number()),
02141|   avgProcessingTimeMinutes: v.optional(v.number()),
02142|   
02143|   computedAt: v.number(),
02144| })
02145|   .index("by_terminal_and_date", ["terminalId", "date"])
02146|   .index("by_terminal_date_hour", ["terminalId", "date", "hour"])
02147|   .index("by_date", ["date"]),
02148| ```
02149| 
02150| ### 9.2 Aggregation Jobs
02151| 
02152| **File:** `packages/backend/convex/analytics/compute.ts`
02153| 
02154| ```typescript
02155| /**
02156|  * Compute hourly aggregates
02157|  * Called by cron every hour
02158|  */
02159| export const computeHourlyAggregates = internalMutation({
02160|   args: {},
02161|   handler: async (ctx) => {
02162|     const now = new Date();
02163|     const currentHour = now.getHours();
02164|     const today = now.toISOString().split("T")[0];
02165| 
02166|     const terminals = await ctx.db
02167|       .query("terminals")
02168|       .filter((q) => q.eq(q.field("isActive"), true))
02169|       .collect();
02170| 
02171|     for (const terminal of terminals) {
02172|       // Get bookings for this hour
02173|       const hourStart = new Date(now);
02174|       hourStart.setMinutes(0, 0, 0);
02175|       const hourEnd = new Date(hourStart);
02176|       hourEnd.setHours(hourEnd.getHours() + 1);
02177| 
02178|       const bookings = await ctx.db
02179|         .query("bookings")
02180|         .withIndex("by_terminal", (q) => q.eq("terminalId", terminal._id))
02181|         .filter((q) =>
02182|           q.and(
02183|             q.gte(q.field("bookedAt"), hourStart.getTime()),
02184|             q.lt(q.field("bookedAt"), hourEnd.getTime())
02185|           )
02186|         )
02187|         .collect();
02188| 
02189|       // Compute aggregates
02190|       const aggregates = {
02191|         totalBookings: bookings.length,
02192|         pendingCount: bookings.filter((b) => b.status === "pending").length,
02193|         confirmedCount: bookings.filter((b) => b.status === "confirmed").length,
02194|         rejectedCount: bookings.filter((b) => b.status === "rejected").length,
02195|         consumedCount: bookings.filter((b) => b.status === "consumed").length,
02196|         cancelledCount: bookings.filter((b) => b.status === "cancelled").length,
02197|         expiredCount: bookings.filter((b) => b.status === "expired").length,
02198|         autoValidatedCount: bookings.filter((b) => b.wasAutoValidated).length,
02199|         totalContainers: bookings.reduce((sum, b) => sum + b.containerIds.length, 0),
02200|         // ... more metrics
02201|       };
02202| 
02203|       // Upsert aggregate
02204|       const existing = await ctx.db
02205|         .query("bookingAggregates")
02206|         .withIndex("by_terminal_date_hour", (q) =>
02207|           q.eq("terminalId", terminal._id).eq("date", today).eq("hour", currentHour)
02208|         )
02209|         .unique();
02210| 
02211|       if (existing) {
02212|         await ctx.db.patch(existing._id, { ...aggregates, computedAt: Date.now() });
02213|       } else {
02214|         await ctx.db.insert("bookingAggregates", {
02215|           terminalId: terminal._id,
02216|           date: today,
02217|           hour: currentHour,
02218|           ...aggregates,
02219|           avgCapacityUtilization: 0,
02220|           peakUtilization: 0,
02221|           pickupContainers: 0,
02222|           dropoffContainers: 0,
02223|           computedAt: Date.now(),
02224|         });
02225|       }
02226|     }
02227|   },
02228| });
02229| ```
02230| 
02231| ### 9.3 Analytics Queries
02232| 
02233| **File:** `packages/backend/convex/analytics/queries.ts`
02234| 
02235| ```typescript
02236| /**
02237|  * Get dashboard metrics for date range
02238|  */
02239| export const getDashboardMetrics = query({
02240|   args: {
02241|     terminalId: v.optional(v.id("terminals")),
02242|     startDate: v.string(),
02243|     endDate: v.string(),
02244|     aggregation: v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly")),
02245|   },
02246|   returns: v.object({
02247|     // Summary metrics
02248|     totalBookings: v.number(),
02249|     avgDailyBookings: v.number(),
02250|     confirmationRate: v.number(),
02251|     autoValidationRate: v.number(),
02252|     avgCapacityUtilization: v.number(),
02253|     
02254|     // Time series data
02255|     timeSeries: v.array(v.object({
02256|       period: v.string(),
02257|       bookings: v.number(),
02258|       utilization: v.number(),
02259|       containers: v.number(),
02260|     })),
02261|     
02262|     // Status breakdown
02263|     statusBreakdown: v.object({
02264|       pending: v.number(),
02265|       confirmed: v.number(),
02266|       rejected: v.number(),
02267|       consumed: v.number(),
02268|       cancelled: v.number(),
02269|       expired: v.number(),
02270|     }),
02271|   }),
02272|   handler: async (ctx, args) => {
02273|     const user = await getAuthenticatedUser(ctx);
02274|     
02275|     // Check permission based on role
02276|     if (args.terminalId) {
02277|       if (!await canManageTerminal(ctx, user, args.terminalId)) {
02278|         throw new ConvexError({ code: "FORBIDDEN" });
02279|       }
02280|     } else if (!isPortAdmin(user)) {
02281|       throw new ConvexError({ code: "FORBIDDEN", message: "Global metrics require admin role" });
02282|     }
02283| 
02284|     // Query aggregates
02285|     let aggregates;
02286|     if (args.terminalId) {
02287|       aggregates = await ctx.db
02288|         .query("bookingAggregates")
02289|         .withIndex("by_terminal_and_date", (q) =>
02290|           q.eq("terminalId", args.terminalId)
02291|         )
02292|         .filter((q) =>
02293|           q.and(
02294|             q.gte(q.field("date"), args.startDate),
02295|             q.lte(q.field("date"), args.endDate)
02296|           )
02297|         )
02298|         .collect();
02299|     } else {
02300|       aggregates = await ctx.db
02301|         .query("bookingAggregates")
02302|         .withIndex("by_date", (q) => q)
02303|         .filter((q) =>
02304|           q.and(
02305|             q.gte(q.field("date"), args.startDate),
02306|             q.lte(q.field("date"), args.endDate)
02307|           )
02308|         )
02309|         .collect();
02310|     }
02311| 
02312|     // Process and return metrics...
02313|     return processAggregates(aggregates, args.aggregation);
02314|   },
02315| });
02316| ```
02317| 
02318| ### 9.4 Export Functionality
02319| 
02320| **File:** `packages/backend/convex/analytics/export.ts`
02321| 
02322| ```typescript
02323| /**
02324|  * Export analytics data to CSV
02325|  */
02326| export const exportToCSV = action({
02327|   args: {
02328|     terminalId: v.optional(v.id("terminals")),
02329|     startDate: v.string(),
02330|     endDate: v.string(),
02331|     dataType: v.union(v.literal("bookings"), v.literal("aggregates")),
02332|   },
02333|   returns: v.string(), // CSV string
02334|   handler: async (ctx, args) => {
02335|     // Fetch data and convert to CSV format
02336|     // ...
02337|   },
02338| });
02339| ```
02340| 
02341| ### Files to Create/Modify
02342| 
02343| | File | Action |
02344| |------|--------|
02345| | `packages/backend/convex/analytics/schema.ts` | Create (add to main schema) |
02346| | `packages/backend/convex/analytics/compute.ts` | Create |
02347| | `packages/backend/convex/analytics/queries.ts` | Create |
02348| | `packages/backend/convex/analytics/export.ts` | Create |
02349| | `packages/backend/convex/crons.ts` | Update (add hourly aggregation) |
02350| | `apps/web/src/features/analytics/` | Create directory |
02351| | `apps/web/src/features/analytics/components/` | Create chart components |
02352| 
02353| ---
02354| 
02355| ## Phase 10: Audit Logging System
02356| 
02357| **Duration:** 3-4 days  
02358| **Dependencies:** Phase 1
02359| 
02360| ### 10.1 Audit Logger Utility
02361| 
02362| **File:** `packages/backend/convex/lib/auditLog.ts`
02363| 
02364| ```typescript
02365| import { MutationCtx } from "../_generated/server";
02366| import { Id } from "../_generated/dataModel";
02367| 
02368| export interface AuditLogEntry {
02369|   userId?: string;
02370|   action: "query" | "mutation" | "ai_tool_call" | "login" | "logout" | "failed_auth" | "permission_denied";
02371|   resource: string;
02372|   resourceId?: string;
02373|   args?: Record<string, unknown>;
02374|   result?: string;
02375|   ipAddress?: string;
02376|   userAgent?: string;
02377|   sessionId?: string;
02378|   aiThreadId?: string;
02379|   aiToolName?: string;
02380|   durationMs?: number;
02381| }
02382| 
02383| /**
02384|  * Log an audit entry
02385|  */
02386| export async function logAudit(
02387|   ctx: MutationCtx,
02388|   entry: AuditLogEntry
02389| ): Promise<Id<"auditLogs">> {
02390|   // Sanitize args (remove sensitive data)
02391|   const sanitizedArgs = entry.args
02392|     ? JSON.stringify(sanitizeArgs(entry.args))
02393|     : undefined;
02394| 
02395|   return await ctx.db.insert("auditLogs", {
02396|     ...entry,
02397|     args: sanitizedArgs,
02398|     timestamp: Date.now(),
02399|   });
02400| }
02401| 
02402| function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
02403|   const sensitiveKeys = ["password", "token", "secret", "apiKey", "creditCard"];
02404|   const sanitized = { ...args };
02405|   
02406|   for (const key of Object.keys(sanitized)) {
02407|     if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
02408|       sanitized[key] = "[REDACTED]";
02409|     }
02410|   }
02411|   
02412|   return sanitized;
02413| }
02414| ```
02415| 
02416| ### 10.2 Audit Wrapper for Mutations
02417| 
02418| **File:** `packages/backend/convex/lib/withAudit.ts`
02419| 
02420| ```typescript
02421| import { mutation } from "../_generated/server";
02422| import { logAudit } from "./auditLog";
02423| 
02424| /**
02425|  * Wrapper to add audit logging to mutations
02426|  */
02427| export function withAudit<Args, Returns>(
02428|   resource: string,
02429|   handler: (ctx: MutationCtx, args: Args) => Promise<Returns>
02430| ) {
02431|   return async (ctx: MutationCtx, args: Args): Promise<Returns> => {
02432|     const startTime = Date.now();
02433|     let result: Returns;
02434|     let error: unknown;
02435| 
02436|     try {
02437|       result = await handler(ctx, args);
02438|       
02439|       // Log success
02440|       await logAudit(ctx, {
02441|         userId: ctx.auth?.getUserIdentity()?.subject,
02442|         action: "mutation",
02443|         resource,
02444|         args: args as Record<string, unknown>,
02445|         result: "success",
02446|         durationMs: Date.now() - startTime,
02447|       });
02448| 
02449|       return result;
02450|     } catch (e) {
02451|       error = e;
02452|       
02453|       // Log failure
02454|       await logAudit(ctx, {
02455|         userId: ctx.auth?.getUserIdentity()?.subject,
02456|         action: "mutation",
02457|         resource,
02458|         args: args as Record<string, unknown>,
02459|         result: `error: ${String(e)}`,
02460|         durationMs: Date.now() - startTime,
02461|       });
02462| 
02463|       throw e;
02464|     }
02465|   };
02466| }
02467| ```
02468| 
02469| ### 10.3 Audit Log Queries
02470| 
02471| **File:** `packages/backend/convex/audit/queries.ts`
02472| 
02473| ```typescript
02474| export const getAuditLogs = query({
02475|   args: {
02476|     userId: v.optional(v.string()),
02477|     action: v.optional(auditActionValidator),
02478|     resource: v.optional(v.string()),
02479|     startDate: v.optional(v.number()),
02480|     endDate: v.optional(v.number()),
02481|     limit: v.optional(v.number()),
02482|   },
02483|   returns: v.array(/* ... */),
02484|   handler: async (ctx, args) => {
02485|     const user = await getAuthenticatedUser(ctx);
02486|     requireRole(user, ["port_admin"]); // Only admins can view audit logs
02487| 
02488|     let query = ctx.db.query("auditLogs");
02489| 
02490|     if (args.userId) {
02491|       query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
02492|     } else if (args.action) {
02493|       query = query.withIndex("by_action", (q) => q.eq("action", args.action));
02494|     } else {
02495|       query = query.withIndex("by_timestamp");
02496|     }
02497| 
02498|     // Apply additional filters
02499|     if (args.startDate) {
02500|       query = query.filter((q) => q.gte(q.field("timestamp"), args.startDate));

(File has more lines. Use 'offset' parameter to read beyond line 2500)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.6s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/.local/share/opencode/tool-output/tool_c34212b0d001zHbr5LxSB1sFlE",
  "limit": 400,
  "offset": 2500
}
```

**Output:**
```
<file>
02501|     }
02502|     if (args.endDate) {
02503|       query = query.filter((q) => q.lte(q.field("timestamp"), args.endDate));
02504|     }
02505| 
02506|     return await query.order("desc").take(args.limit ?? 100);
02507|   },
02508| });
02509| ```
02510| 
02511| ### Files to Create/Modify
02512| 
02513| | File | Action |
02514| |------|--------|
02515| | `packages/backend/convex/lib/auditLog.ts` | Create |
02516| | `packages/backend/convex/lib/withAudit.ts` | Create |
02517| | `packages/backend/convex/audit/queries.ts` | Create |
02518| | `packages/backend/convex/audit/mutations.ts` | Create (cleanup) |
02519| | `apps/web/src/features/audit/` | Create directory |
02520| | `apps/web/src/routes/admin/audit-logs.tsx` | Create |
02521| 
02522| ---
02523| 
02524| ## Phase 11: Seed Data Generation
02525| 
02526| **Duration:** 2-3 days  
02527| **Dependencies:** All previous phases
02528| 
02529| ### 11.1 Seed Script
02530| 
02531| **File:** `packages/backend/convex/seed/index.ts`
02532| 
02533| ```typescript
02534| import { internalMutation } from "../_generated/server";
02535| import { faker } from "@faker-js/faker";
02536| 
02537| /**
02538|  * Generate realistic seed data
02539|  * ~500-1000 containers, proportional trucks, bookings
02540|  */
02541| export const seedDatabase = internalMutation({
02542|   args: {},
02543|   handler: async (ctx) => {
02544|     // 1. Create terminals (3-5)
02545|     const terminals = await seedTerminals(ctx, 4);
02546| 
02547|     // 2. Create gates per terminal (2-4 each)
02548|     const gates = await seedGates(ctx, terminals);
02549| 
02550|     // 3. Create time slots (next 30 days, 1-hour slots)
02551|     await seedTimeSlots(ctx, terminals);
02552| 
02553|     // 4. Create carrier users (20-30)
02554|     const carriers = await seedCarriers(ctx, 25);
02555| 
02556|     // 5. Create trucks per carrier (2-5 each)
02557|     const trucks = await seedTrucks(ctx, carriers);
02558| 
02559|     // 6. Create containers (500-1000)
02560|     const containers = await seedContainers(ctx, carriers, 750);
02561| 
02562|     // 7. Create bookings with realistic distribution
02563|     await seedBookings(ctx, terminals, carriers, trucks, containers);
02564| 
02565|     // 8. Create terminal operators (5-10)
02566|     await seedOperators(ctx, terminals, 8);
02567| 
02568|     return {
02569|       terminals: terminals.length,
02570|       gates: Object.values(gates).flat().length,
02571|       carriers: carriers.length,
02572|       trucks: trucks.length,
02573|       containers: containers.length,
02574|     };
02575|   },
02576| });
02577| 
02578| async function seedTerminals(ctx: MutationCtx, count: number) {
02579|   const terminals: Id<"terminals">[] = [];
02580|   const portNames = ["Terminal Nord", "Terminal Sud", "Terminal Est", "Terminal Conteneurs", "Terminal Ro-Ro"];
02581| 
02582|   for (let i = 0; i < count; i++) {
02583|     const id = await ctx.db.insert("terminals", {
02584|       name: portNames[i],
02585|       code: `TER${i + 1}`,
02586|       address: faker.location.streetAddress(),
02587|       timezone: "Europe/Paris",
02588|       isActive: true,
02589|       autoValidationThreshold: faker.number.int({ min: 40, max: 70 }),
02590|       capacityAlertThresholds: [70, 85, 95],
02591|       createdAt: Date.now(),
02592|       updatedAt: Date.now(),
02593|       createdBy: "seed",
02594|     });
02595|     terminals.push(id);
02596|   }
02597| 
02598|   return terminals;
02599| }
02600| 
02601| async function seedContainers(
02602|   ctx: MutationCtx,
02603|   carriers: string[],
02604|   count: number
02605| ) {
02606|   const containers: Id<"containers">[] = [];
02607|   const containerTypes = ["dry", "reefer", "open_top", "flat_rack", "tank", "hazardous"];
02608|   const dimensions = ["20ft", "40ft", "40ft_hc", "45ft"];
02609|   const weightClasses = ["light", "medium", "heavy", "max"];
02610| 
02611|   for (let i = 0; i < count; i++) {
02612|     const carrierId = faker.helpers.arrayElement(carriers);
02613|     const operationType = faker.helpers.arrayElement(["pick_up", "drop_off"]);
02614| 
02615|     const id = await ctx.db.insert("containers", {
02616|       ownerId: carrierId,
02617|       containerNumber: generateContainerNumber(),
02618|       type: faker.helpers.arrayElement(containerTypes) as any,
02619|       dimensions: faker.helpers.arrayElement(dimensions) as any,
02620|       weightClass: faker.helpers.arrayElement(weightClasses) as any,
02621|       operationType: operationType as any,
02622|       readyDate: operationType === "pick_up" 
02623|         ? faker.date.soon({ days: 14 }).getTime() 
02624|         : undefined,
02625|       departureDate: operationType === "drop_off"
02626|         ? faker.date.soon({ days: 30 }).getTime()
02627|         : undefined,
02628|       isEmpty: faker.datatype.boolean({ probability: 0.3 }),
02629|       isActive: true,
02630|       createdAt: Date.now(),
02631|       updatedAt: Date.now(),
02632|       createdBy: carrierId,
02633|     });
02634|     containers.push(id);
02635|   }
02636| 
02637|   return containers;
02638| }
02639| 
02640| function generateContainerNumber(): string {
02641|   const ownerCode = faker.string.alpha({ length: 4, casing: "upper" });
02642|   const serial = faker.string.numeric(6);
02643|   const checkDigit = faker.string.numeric(1);
02644|   return `${ownerCode}${serial}${checkDigit}`;
02645| }
02646| 
02647| // ... more seeding functions
02648| ```
02649| 
02650| ### 11.2 Seed Command
02651| 
02652| **File:** `packages/backend/package.json`
02653| 
02654| ```json
02655| {
02656|   "scripts": {
02657|     "seed": "convex run seed:seedDatabase"
02658|   }
02659| }
02660| ```
02661| 
02662| ### Files to Create
02663| 
02664| | File | Action |
02665| |------|--------|
02666| | `packages/backend/convex/seed/index.ts` | Create |
02667| | `packages/backend/convex/seed/terminals.ts` | Create |
02668| | `packages/backend/convex/seed/containers.ts` | Create |
02669| | `packages/backend/convex/seed/bookings.ts` | Create |
02670| | `packages/backend/convex/seed/users.ts` | Create |
02671| 
02672| ---
02673| 
02674| ## Implementation Timeline Summary
02675| 
02676| | Phase | Duration | Dependencies | Key Deliverables |
02677| |-------|----------|--------------|------------------|
02678| | 1. Schema Refactoring | 3-5 days | None | New schema, containers table, audit logs |
02679| | 2. Core Backend | 5-7 days | Phase 1 | Permissions, capacity engine, booking mutations |
02680| | 3. AI Tools | 7-10 days | Phase 1, 2 | French AI agent, booking flow tools, widgets |
02681| | 4. Time Slot Bulk Editing | 4-5 days | Phase 1, 2 | Bulk create, copy templates, weekly patterns |
02682| | 5. Auto-Validation | 3-4 days | Phase 1, 2, 4 | Threshold engine, approval workflow, queue UI |
02683| | 6. Notifications | 4-5 days | Phase 1, 5 | Email integration, templates, alerts |
02684| | 7. QR Codes | 3-4 days | Phase 5 | Generation, scanning, entry/exit tracking |
02685| | 8. Dashboard UI | 5-7 days | Phase 1-7 | Role-specific dashboards, chat sidebar |
02686| | 9. Analytics | 5-7 days | Phase 8 | Aggregates, charts, exports |
02687| | 10. Audit Logging | 3-4 days | Phase 1 | Full audit trail, admin UI |
02688| | 11. Seed Data | 2-3 days | All | Realistic demo dataset |
02689| 
02690| **Total Estimated Duration:** 45-61 days (9-12 weeks)
02691| 
02692| ---
02693| 
02694| ## Risk Mitigation
02695| 
02696| 1. **Schema Migration Complexity**: Use Convex migrations component for safe schema evolution
02697| 2. **Performance with Large Data**: Leverage Convex aggregates component for analytics
02698| 3. **AI Tool Reliability**: Implement fallback messages and error handling in tool handlers
02699| 4. **Email Deliverability**: Use Resend with proper domain verification
02700| 5. **QR Code Security**: Only store reference in QR, require server lookup for details
02701| 
02702| ---
02703| 
02704| ## Testing Strategy
02705| 
02706| 1. **Unit Tests**: Jest for utility functions (validators, formatters)
02707| 2. **Integration Tests**: Convex test client for mutations/queries
02708| 3. **E2E Tests**: Playwright for critical user flows (booking, approval, scanning)
02709| 4. **Load Testing**: Verify capacity engine under concurrent bookings
02710| 
02711| <task_metadata>
02712| session_id: ses_3cbe38fddffe3HkbBZOttJzpHk
02713| </task_metadata>

(End of file - total 2713 lines)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 80.8s)

I now have the complete implementation plan. Let me write this to the plan file:

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "content": "# APCS Maritime Port Booking System - Implementation Plan\n\n## Overview\n\nThis plan covers the development of a centralized platform to regulate maritime port access through a synchronized booking system and terminal capacity engine with a conversational AI interface.\n\n### Key Requirements Summary\n\n| Aspect | Specification |\n|--------|---------------|\n| **User Roles** | Port Admin, Terminal Operator, Carrier |\n| **Interface** | Conversational AI (chat-centric) + Traditional dashboards in sidebar |\n| **Booking Model** | 1 booking = 1 truck + multiple containers (pick-up/drop-off) |\n| **Capacity** | Terminal-level (truck count), not gate-level |\n| **Auto-Validation** | First N% of slot capacity auto-approved (N configurable) |\n| **Language** | French only (UI + AI responses) |\n| **QR Code** | Reference ID only (server lookup required), double scan (entry + exit) |\n| **Analytics** | Comprehensive with Convex aggregate component, export to CSV/PDF |\n| **Audit Logging** | Full trail (mutations + queries + AI tool calls + failed attempts) |\n\n---\n\n## Phase 1: Schema Refactoring (Foundation)\n**Duration:** 3-5 days | **Priority:** Critical\n\n### Changes\n\n**Remove carrier company concept:**\n- Delete `carrierCompanies` and `carrierUsers` tables\n- Trucks belong directly to carrier users via `ownerId`\n\n**Add containers table:**\n```\ncontainers: {\n  ownerId, containerNumber, type (dry/reefer/open_top/flat_rack/tank/hazardous),\n  dimensions (20ft/40ft/40ft_hc/45ft), weightClass, operationType (pick_up/drop_off),\n  readyDate, departureDate, isEmpty, bookingId, isActive\n}\n```\n\n**Refactor bookings table:**\n```\nbookings: {\n  terminalId, carrierId, truckId, gateId (assigned at approval),\n  bookingReference (TER1-BK-001234), status, wasAutoValidated,\n  containerIds[], preferredDate/Time, entryScannedAt, exitScannedAt,\n  qrCode, qrCodeStorageId, driverInfo\n}\n```\n\n**Update time slots:** Terminal-level capacity (not gate), add `autoValidationThreshold`\n\n**Add audit logs table:** Full audit trail with userId, action, resource, args, result, IP/device info\n\n### Files to Modify/Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/schema.ts` | Major refactor |\n| `packages/backend/convex/lib/validators.ts` | Add new validators |\n| `packages/backend/convex/containers/queries.ts` | Create |\n| `packages/backend/convex/containers/mutations.ts` | Create |\n| `packages/backend/convex/audit/queries.ts` | Create |\n| `packages/backend/convex/audit/mutations.ts` | Create |\n\n---\n\n## Phase 2: Core Backend Functions\n**Duration:** 5-7 days | **Dependencies:** Phase 1\n\n### Key Changes\n\n- **Permissions:** Remove carrier company logic, update `canManageTruck` for direct ownership\n- **Capacity Engine:** Terminal-level capacity with `getTerminalSlotCapacity()`, `shouldAutoValidate()`\n- **Booking Mutations:**\n  - Container validation (ownership, availability)\n  - Auto-validation logic on create\n  - Terminal-prefixed reference generation (`TER1-BK-XXXXXX`)\n  - Gate assignment at approval time (load-balanced across compatible gates)\n\n### Files to Modify\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/lib/permissions.ts` | Modify |\n| `packages/backend/convex/lib/capacity.ts` | Major refactor |\n| `packages/backend/convex/bookings/mutations.ts` | Major refactor |\n| `packages/backend/convex/bookings/queries.ts` | Modify |\n| `packages/backend/convex/bookings/internal.ts` | Create gate assignment logic |\n| `packages/backend/convex/trucks/mutations.ts` | Remove carrier company refs |\n\n---\n\n## Phase 3: AI Tools and Conversational Flows\n**Duration:** 7-10 days | **Dependencies:** Phase 1, 2\n\n### Agent Configuration\n\n- French-only responses\n- System prompt for booking flow guidance\n- `maxSteps: 10` for complex conversations\n\n### New AI Tools\n\n| Tool | Role | Purpose |\n|------|------|---------|\n| `listMyContainers` | carrier | List carrier's containers with filters |\n| `selectContainersForBooking` | carrier | Interactive container selection widget |\n| `suggestOptimalSlots` | carrier | Slot recommendations (load balancing + urgency) |\n| `getSlotAvailability` | carrier/operator | Calendar view of slot availability |\n| `createBookingViaAI` | carrier | Create booking mutation |\n| `cancelBookingViaAI` | carrier | Cancel booking mutation |\n| `changeTruckViaAI` | carrier | Change truck assignment |\n| `listMyTrucks` | carrier | List carrier's trucks |\n\n### Chat Widget Components\n\nCreate in `apps/web/src/components/ai-elements/apcs/`:\n- `container-list.tsx` - Display containers\n- `container-selector.tsx` - Interactive selection\n- `slot-suggestions.tsx` - Optimal slot recommendations\n- `slot-calendar.tsx` - Availability calendar\n- `booking-confirmation-card.tsx` - Booking result with status\n- `truck-selector.tsx` - Truck selection\n- `booking-summary.tsx` - Expandable booking details\n\n### Files to Create/Modify\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/ai/agent.ts` | Update (French instructions) |\n| `packages/backend/convex/ai/tools/containers.ts` | Create |\n| `packages/backend/convex/ai/tools/slots.ts` | Create |\n| `packages/backend/convex/ai/tools/booking-flow.ts` | Create |\n| `packages/backend/convex/ai/tools/trucks.ts` | Create |\n| `packages/backend/convex/ai/registry.ts` | Update |\n| `packages/backend/convex/ai/tools/types.ts` | Update permissions |\n| `apps/web/src/components/ai-elements/apcs/*.tsx` | Create 7 files |\n\n---\n\n## Phase 4: Time Slot Bulk Editing\n**Duration:** 4-5 days | **Dependencies:** Phase 1, 2\n\n### Bulk Operations\n\n1. **Same day, multiple slots:** Bulk update capacity for all morning/afternoon slots\n2. **Copy day template:** Apply one day's configuration to other days\n3. **Weekly recurring patterns:** Define patterns that apply to specific days of week\n\n### Mutations\n\n- `copyDayTemplate(terminalId, sourceDate, targetDates[], skipExisting)`\n- `createWeeklyPattern(terminalId, startDate, endDate, daysOfWeek[], slots[], skipExisting)`\n- `bulkUpdateCapacity(terminalId, date, slotIds?, maxCapacity, autoValidationThreshold?)`\n- `bulkToggleActive(terminalId, date, slotIds, isActive)`\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/timeSlots/mutations.ts` | Major update |\n| `apps/web/src/features/time-slots/components/slot-editor.tsx` | Create |\n| `apps/web/src/features/time-slots/components/bulk-slot-editor.tsx` | Create |\n| `apps/web/src/features/time-slots/components/day-template-picker.tsx` | Create |\n| `apps/web/src/features/time-slots/components/weekly-pattern-wizard.tsx` | Create |\n| `apps/web/src/routes/operator/slots.tsx` | Create |\n\n---\n\n## Phase 5: Auto-Validation and Approval Workflows\n**Duration:** 3-4 days | **Dependencies:** Phase 1, 2, 4\n\n### Auto-Validation Engine\n\n- Check confirmed auto-validated count vs threshold limit\n- Threshold = `(maxCapacity × autoValidationThreshold) / 100`\n- First N% auto-approved, rest queued for manual review\n\n### Manual Approval Workflow\n\n- `confirmBooking(bookingId, gateId?, note?)` - Assigns gate, generates QR, sends notification\n- `rejectBooking(bookingId, reason)` - Records rejection, sends notification\n- Approval queue UI with FIFO ordering (priority algorithm later)\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/lib/autoValidation.ts` | Create |\n| `packages/backend/convex/bookings/mutations.ts` | Update confirm/reject |\n| `apps/web/src/features/approvals/components/approval-queue.tsx` | Create |\n| `apps/web/src/features/approvals/components/approval-card.tsx` | Create |\n| `apps/web/src/features/approvals/components/bulk-approval.tsx` | Create |\n| `apps/web/src/routes/operator/approvals.tsx` | Create |\n\n---\n\n## Phase 6: Notification System with Email\n**Duration:** 4-5 days | **Dependencies:** Phase 1, 5\n\n### Notification Triggers\n\n| Event | Recipients |\n|-------|------------|\n| Booking created | Carrier |\n| Booking confirmed | Carrier |\n| Booking rejected | Carrier |\n| Booking cancelled | Carrier |\n| Slot reminder | Carrier |\n| Capacity alert | Terminal operators |\n\n### Email Integration\n\n- Use Resend for email delivery\n- French templates for all notification types\n- User preference for channel (in-app, email, or both)\n\n### Capacity Alert System\n\n- Configurable thresholds per terminal (e.g., [70, 85, 95])\n- Cron job checks capacity utilization daily\n- Alerts sent to assigned terminal operators\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/notifications/service.ts` | Create |\n| `packages/backend/convex/email/index.ts` | Create |\n| `packages/backend/convex/scheduled.ts` | Update (capacity alerts) |\n| `packages/backend/convex/crons.ts` | Update |\n\n---\n\n## Phase 7: QR Code Generation and Scanning\n**Duration:** 3-4 days | **Dependencies:** Phase 5\n\n### QR Code Generation\n\n- Contains only booking reference + type identifier\n- Generated on booking approval (auto or manual)\n- Stored in Convex file storage + data URL for immediate display\n\n### Double Scan System\n\n- Entry scan: Updates status to \"consumed\", records timestamp\n- Exit scan: Records exit timestamp\n- Both scans require terminal operator role\n\n### Scan Validation\n\n- Verify booking reference exists\n- Verify gate belongs to correct terminal\n- Verify booking status allows the scan type\n- Verify user has terminal access\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/qr/index.ts` | Create |\n| `packages/backend/convex/qr/scan.ts` | Create |\n| `apps/web/src/features/scanner/components/qr-scanner.tsx` | Create |\n| `apps/web/src/features/scanner/components/scan-result.tsx` | Create |\n| `apps/web/src/routes/operator/scanner.tsx` | Create |\n\n---\n\n## Phase 8: Dashboard UI Components\n**Duration:** 5-7 days | **Dependencies:** Phase 1-7\n\n### Layout\n\n- Main navigation sidebar (left)\n- Content area (center)\n- Closeable chat sidebar (right) - accessible from all dashboard pages\n\n### Role-Specific Dashboards\n\n| Role | Dashboard Features |\n|------|-------------------|\n| Port Admin | Global overview, system config, user management, audit logs |\n| Terminal Operator | Terminal-specific metrics, approval queue, slot management, scanner |\n| Carrier | Personal bookings, truck fleet, container list, booking history |\n\n### Dashboard Components\n\nCreate in `apps/web/src/features/dashboard/`:\n- `stats-card.tsx` - Metric card with trend\n- `booking-chart.tsx` - Booking trends\n- `capacity-gauge.tsx` - Terminal capacity gauge\n- `recent-activity.tsx` - Activity feed\n- `pending-actions.tsx` - Actions needing attention\n- `terminal-overview.tsx` - Terminal status grid\n- `date-range-picker.tsx` - Custom date selection\n- `export-button.tsx` - CSV/PDF export\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `apps/web/src/layouts/dashboard-layout.tsx` | Create |\n| `apps/web/src/components/chat-sidebar.tsx` | Create |\n| `apps/web/src/routes/admin/dashboard.tsx` | Create |\n| `apps/web/src/routes/operator/dashboard.tsx` | Create |\n| `apps/web/src/routes/carrier/dashboard.tsx` | Create |\n| `apps/web/src/features/dashboard/components/*.tsx` | Create 8 files |\n\n---\n\n## Phase 9: Analytics with Aggregations\n**Duration:** 5-7 days | **Dependencies:** Phase 8\n\n### Aggregation Tables\n\n```\nbookingAggregates: {\n  terminalId, date, hour?,\n  counts (total, pending, confirmed, rejected, consumed, cancelled, expired, autoValidated),\n  capacity metrics (avg/peak utilization),\n  container metrics (total, pickup, dropoff),\n  timing (avgWaitTime, avgProcessingTime),\n  computedAt\n}\n```\n\n### Aggregation Jobs\n\n- Hourly aggregation cron job\n- Daily rollup aggregation\n- Weekly summary aggregation\n\n### Analytics Features\n\n- Custom date range picker with presets\n- Hourly/daily/weekly aggregation views\n- Terminal-specific vs global metrics\n- Export to CSV and PDF\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/schema.ts` | Add bookingAggregates |\n| `packages/backend/convex/analytics/compute.ts` | Create |\n| `packages/backend/convex/analytics/queries.ts` | Create |\n| `packages/backend/convex/analytics/export.ts` | Create |\n| `packages/backend/convex/crons.ts` | Add hourly aggregation |\n| `apps/web/src/features/analytics/components/*.tsx` | Create chart components |\n\n---\n\n## Phase 10: Audit Logging System\n**Duration:** 3-4 days | **Dependencies:** Phase 1\n\n### Audit Entry Structure\n\n```\nauditLogs: {\n  userId?, action, resource, resourceId?, args (sanitized), result,\n  ipAddress?, userAgent?, sessionId?, aiThreadId?, aiToolName?,\n  timestamp, durationMs?\n}\n```\n\n### Audit Actions\n\n- `query`, `mutation`, `ai_tool_call`, `login`, `logout`, `failed_auth`, `permission_denied`\n\n### Implementation\n\n- `logAudit()` utility function with arg sanitization\n- `withAudit()` wrapper for mutations\n- Admin-only audit log viewer with filters\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/lib/auditLog.ts` | Create |\n| `packages/backend/convex/lib/withAudit.ts` | Create |\n| `packages/backend/convex/audit/queries.ts` | Create |\n| `apps/web/src/routes/admin/audit-logs.tsx` | Create |\n\n---\n\n## Phase 11: Seed Data Generation\n**Duration:** 2-3 days | **Dependencies:** All previous phases\n\n### Seed Data Scale\n\n| Entity | Count |\n|--------|-------|\n| Terminals | 4 |\n| Gates | 2-4 per terminal |\n| Time Slots | 30 days × 24 hours |\n| Carriers | 25 |\n| Trucks | 2-5 per carrier (~75 total) |\n| Containers | 750 |\n| Terminal Operators | 8 |\n| Bookings | Realistic distribution |\n\n### Container Generation\n\n- ISO 6346 format container numbers\n- Realistic distribution of types, dimensions, weight classes\n- 70% drop-off, 30% pick-up operations\n- 30% empty containers\n\n### Files to Create\n\n| File | Action |\n|------|--------|\n| `packages/backend/convex/seed/index.ts` | Create |\n| `packages/backend/convex/seed/terminals.ts` | Create |\n| `packages/backend/convex/seed/containers.ts` | Create |\n| `packages/backend/convex/seed/bookings.ts` | Create |\n| `packages/backend/convex/seed/users.ts` | Create |\n\n---\n\n## Timeline Summary\n\n| Phase | Duration | Cumulative |\n|-------|----------|------------|\n| 1. Schema Refactoring | 3-5 days | Week 1 |\n| 2. Core Backend | 5-7 days | Week 2 |\n| 3. AI Tools | 7-10 days | Week 3-4 |\n| 4. Time Slot Bulk Editing | 4-5 days | Week 5 |\n| 5. Auto-Validation | 3-4 days | Week 5-6 |\n| 6. Notifications | 4-5 days | Week 6-7 |\n| 7. QR Codes | 3-4 days | Week 7 |\n| 8. Dashboard UI | 5-7 days | Week 8-9 |\n| 9. Analytics | 5-7 days | Week 9-10 |\n| 10. Audit Logging | 3-4 days | Week 10-11 |\n| 11. Seed Data | 2-3 days | Week 11 |\n\n**Total Estimated Duration:** 45-61 days (9-12 weeks)\n\n---\n\n## Verification Strategy\n\n### Unit Tests\n- Validators and utility functions\n- Capacity calculations\n- Auto-validation logic\n\n### Integration Tests\n- Booking creation flow (with auto-validation)\n- Approval workflow\n- QR scan sequences\n\n### E2E Tests (Playwright)\n1. Carrier booking flow via AI chat\n2. Terminal operator approval workflow\n3. QR scan entry/exit sequence\n4. Admin configuration changes\n\n### Performance Tests\n- Concurrent booking creation\n- Capacity engine under load\n- Analytics queries with large datasets\n\n---\n\n## Critical Files Reference\n\n### Backend Core\n- `packages/backend/convex/schema.ts`\n- `packages/backend/convex/lib/permissions.ts`\n- `packages/backend/convex/lib/capacity.ts`\n- `packages/backend/convex/bookings/mutations.ts`\n- `packages/backend/convex/ai/agent.ts`\n- `packages/backend/convex/ai/registry.ts`\n\n### Frontend Core\n- `apps/web/src/layouts/dashboard-layout.tsx`\n- `apps/web/src/components/chat-sidebar.tsx`\n- `apps/web/src/components/ai-elements/apcs/*.tsx`\n- `apps/web/src/features/*/components/*.tsx`\n"
}
```

**Output:**
```
Wrote file successfully.

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/convex.config.ts">
ERROR [2:19] Cannot find module '@convex-dev/agent/convex.config' or its corresponding type declarations.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/env/src/native.ts">
ERROR [10:15] Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/users/queries.ts">
ERROR [87:25] Property 'apcsRole' does not exist on type '{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
ERROR [118:18] Argument of type '"by_role"' is not assignable to parameter of type '"by_user" | keyof SystemIndexes'.
ERROR [118:41] Argument of type '"apcsRole"' is not assignable to parameter of type '"_creationTime" | "userId" | "_id"'.
ERROR [140:29] Property 'apcsRole' does not exist on type '{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
ERROR [174:18] Argument of type '"by_role"' is not assignable to parameter of type '"by_user" | keyof SystemIndexes'.
ERROR [174:41] Argument of type '"apcsRole"' is not assignable to parameter of type '"_creationTime" | "userId" | "_id"'.
ERROR [179:19] Property 'apcsRole' does not exist on type '{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/users/mutations.ts">
ERROR [57:7] Object literal may only specify known properties, and 'apcsRole' does not exist in type '{ phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
ERROR [90:9] Object literal may only specify known properties, and 'apcsRole' does not exist in type 'PatchValue<{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }>'.
ERROR [99:7] Object literal may only specify known properties, and 'apcsRole' does not exist in type '{ phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
ERROR [127:29] Property 'apcsRole' does not exist on type '{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/carriers/mutations.ts">
ERROR [145:9] Object literal may only specify known properties, and 'apcsRole' does not exist in type 'PatchValue<{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }>'.
ERROR [151:9] Object literal may only specify known properties, and 'apcsRole' does not exist in type '{ phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
ERROR [282:9] Object literal may only specify known properties, and 'apcsRole' does not exist in type 'PatchValue<{ _id: Id<"userProfiles">; _creationTime: number; phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }>'.
ERROR [288:9] Object literal may only specify known properties, and 'apcsRole' does not exist in type '{ phone?: string | undefined; preferredLanguage: "en" | "fr"; notificationChannel: "in_app" | "email" | "both"; createdAt: number; updatedAt: number; userId: string; }'.
</diagnostics>
```

---

## Assistant (Plan · claude-opus-4.5 · 825.0s)

I've created a comprehensive implementation plan. The plan is now saved and ready for review. Let me provide a summary of what it covers:

## Plan Summary

The implementation plan for **APCS (Advanced Port Container System)** covers **11 phases** over an estimated **9-12 weeks**:

### Core Components

1. **Schema Refactoring** - Remove carrier company concept, add containers table, refactor bookings for multi-container support
2. **Core Backend** - Permissions, terminal-level capacity engine, auto-validation logic
3. **AI Tools** - French-only agent, booking flow tools (container selection, slot suggestions, booking creation), chat widgets
4. **Time Slot Bulk Editing** - Copy templates, weekly patterns, bulk capacity updates
5. **Auto-Validation** - First N% auto-approved, approval queue for operators
6. **Notifications** - In-app + email (Resend), French templates, capacity alerts
7. **QR Codes** - Reference-only QR, double scan (entry + exit)
8. **Dashboard UI** - Role-specific dashboards, closeable chat sidebar
9. **Analytics** - Convex aggregates, custom date ranges, CSV/PDF export
10. **Audit Logging** - Full audit trail for all operations
11. **Seed Data** - ~750 containers, 25 carriers, realistic bookings

### Key Design Decisions Based on Your Answers

| Decision | Choice |
|----------|--------|
| Booking model | 1 truck + multiple containers |
| Capacity | Terminal-level (truck count) |
| Auto-validation | First N% of capacity |
| Gate assignment | At approval time |
| Container properties | Type, dimensions (20ft/40ft/40ftHC/45ft), weight class |
| Language | French only |
| QR content | Reference ID only |
| Mobile app | Excluded for now |

**Tool: plan_exit**

**Input:**
```json
{}
```

**Error:**
```
Error: The user dismissed this question
```

---

## User

# Convex Development Skills

This is an index skill for Convex development. Use specific skills for detailed guidance:

## Core Development

| Skill | Command | Use When |
|-------|---------|----------|
| Functions | `/convex-functions` | Writing queries, mutations, actions |
| Schema | `/convex-schema-validator` | Defining database schemas and validators |
| Realtime | `/convex-realtime` | Building reactive subscriptions |
| HTTP Actions | `/convex-http-actions` | Webhooks and HTTP endpoints |

## Data & Storage

| Skill | Command | Use When |
|-------|---------|----------|
| File Storage | `/convex-file-storage` | File uploads, serving, storage |
| Migrations | `/convex-migrations` | Schema evolution, data backfills |

## Advanced Patterns

| Skill | Command | Use When |
|-------|---------|----------|
| Agents | `/convex-agents` | Building AI agents with tools |
| Cron Jobs | `/convex-cron-jobs` | Scheduled background tasks |
| Components | `/convex-component-authoring` | Reusable Convex packages |

## Security

| Skill | Command | Use When |
|-------|---------|----------|
| Security Check | `/convex-security-check` | Quick security audit checklist |
| Security Audit | `/convex-security-audit` | Deep security review |

## Guidelines

| Skill | Command | Use When |
|-------|---------|----------|
| Best Practices | `/convex-best-practices` | General patterns and guidelines |

## Quick Start

For most tasks:
1. Start with `/convex-best-practices` for general patterns
2. Use `/convex-functions` for writing backend logic
3. Use `/convex-schema-validator` for data modeling
4. Use specific skills as needed for your use case

## Documentation

- Primary: https://docs.convex.dev
- LLM-optimized: https://docs.convex.dev/llms.txt


Now write a plan for backend implementation. It should be exhaustive and make the backend ready with full implementation details..

---

## Assistant (Plan · claude-opus-4.5 · 10.2s)

_Thinking:_

The user wants me to create a detailed backend implementation plan. They want it to be exhaustive and ready for full implementation. Let me first load the relevant Convex skills to ensure I follow best practices, then create a comprehensive backend plan.

I should load the key Convex skills to inform the plan:
1. convex-best-practices - for general patterns
2. convex-functions - for writing backend logic
3. convex-schema-validator - for data modeling
4. convex-agents - for AI agent implementation

Let me load these skills and then create a detailed backend implementation plan.

I'll load the relevant Convex skills to ensure the backend plan follows best practices, then create an exhaustive implementation plan.

**Tool: skill**

**Input:**
```json
{
  "name": "convex-best-practices"
}
```

**Output:**
```
<skill_content name="convex-best-practices">
# Skill: convex-best-practices

# Convex Best Practices

Build production-ready Convex applications by following established patterns for function organization, query optimization, validation, TypeScript usage, and error handling.

## Code Quality

All patterns in this skill comply with `@convex-dev/eslint-plugin`. Install it for build-time validation:

```bash
npm i @convex-dev/eslint-plugin --save-dev
```

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...convexPlugin.configs.recommended,
]);
```

The plugin enforces four rules:

| Rule                                | What it enforces                  |
| ----------------------------------- | --------------------------------- |
| `no-old-registered-function-syntax` | Object syntax with `handler`      |
| `require-argument-validators`       | `args: {}` on all functions       |
| `explicit-table-ids`                | Table name in db operations       |
| `import-wrong-runtime`              | No Node imports in Convex runtime |

Docs: https://docs.convex.dev/eslint

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/understanding/best-practices/
- Error Handling: https://docs.convex.dev/functions/error-handling
- Write Conflicts: https://docs.convex.dev/error#1
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### The Zen of Convex

1. **Convex manages the hard parts** - Let Convex handle caching, real-time sync, and consistency
2. **Functions are the API** - Design your functions as your application's interface
3. **Schema is truth** - Define your data model explicitly in schema.ts
4. **TypeScript everywhere** - Leverage end-to-end type safety
5. **Queries are reactive** - Think in terms of subscriptions, not requests

### Function Organization

Organize your Convex functions by domain:

```typescript
// convex/users.ts - User-related functions
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get("users", args.userId);
  },
});
```

### Argument and Return Validation

Always define validators for arguments AND return types:

```typescript
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      priority: args.priority,
      completed: false,
      createdAt: Date.now(),
    });
  },
});
```

### Query Patterns

Use indexes instead of filters for efficient queries:

```typescript
// Schema with index
export default defineSchema({
  tasks: defineTable({
    userId: v.id("users"),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),
});

// Query using index
export const getTasksByUser = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
      userId: v.id("users"),
      status: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
```

### Error Handling

Use ConvexError for user-facing errors:

```typescript
import { ConvexError } from "convex/values";

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.taskId);

    if (!task) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Task not found",
      });
    }

    await ctx.db.patch("tasks", args.taskId, { title: args.title });
    return null;
  },
});
```

### Avoiding Write Conflicts (Optimistic Concurrency Control)

Convex uses OCC. Follow these patterns to minimize conflicts:

```typescript
// GOOD: Make mutations idempotent
export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.taskId);

    // Early return if already complete (idempotent)
    if (!task || task.status === "completed") {
      return null;
    }

    await ctx.db.patch("tasks", args.taskId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});

// GOOD: Patch directly without reading first when possible
export const updateNote = mutation({
  args: { id: v.id("notes"), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Patch directly - ctx.db.patch throws if document doesn't exist
    await ctx.db.patch("notes", args.id, { content: args.content });
    return null;
  },
});

// GOOD: Use Promise.all for parallel independent updates
export const reorderItems = mutation({
  args: { itemIds: v.array(v.id("items")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates = args.itemIds.map((id, index) =>
      ctx.db.patch("items", id, { order: index }),
    );
    await Promise.all(updates);
    return null;
  },
});
```

### TypeScript Best Practices

```typescript
import { Id, Doc } from "./_generated/dataModel";

// Use Id type for document references
type UserId = Id<"users">;

// Use Doc type for full documents
type User = Doc<"users">;

// Define Record types properly
const userScores: Record<Id<"users">, number> = {};
```

### Internal vs Public Functions

```typescript
// Public function - exposed to clients
export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      /* ... */
    }),
  ),
  handler: async (ctx, args) => {
    // ...
  },
});

// Internal function - only callable from other Convex functions
export const _updateUserStats = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // ...
  },
});
```

## Examples

### Complete CRUD Pattern

```typescript
// convex/tasks.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const taskValidator = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  title: v.string(),
  completed: v.boolean(),
  userId: v.id("users"),
});

export const list = query({
  args: { userId: v.id("users") },
  returns: v.array(taskValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      userId: args.userId,
    });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch("tasks", taskId, cleanUpdates);
    }
    return null;
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete("tasks", args.taskId);
    return null;
  },
});
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Always define return validators for functions
- Use indexes for all queries that filter data
- Make mutations idempotent to handle retries gracefully
- Use ConvexError for user-facing error messages
- Organize functions by domain (users.ts, tasks.ts, etc.)
- Use internal functions for sensitive operations
- Leverage TypeScript's Id and Doc types

## Common Pitfalls

1. **Using filter instead of withIndex** - Always define indexes and use withIndex
2. **Missing return validators** - Always specify the returns field
3. **Non-idempotent mutations** - Check current state before updating
4. **Reading before patching unnecessarily** - Patch directly when possible
5. **Not handling null returns** - Document IDs might not exist

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- Best Practices: https://docs.convex.dev/understanding/best-practices/
- Error Handling: https://docs.convex.dev/functions/error-handling
- Write Conflicts: https://docs.convex.dev/error#1

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-best-practices
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-best-practices/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-best-practices/assets/small-logo.svg</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-best-practices/assets/large-logo.png</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "convex-functions"
}
```

**Output:**
```
<skill_content name="convex-functions">
# Skill: convex-functions

# Convex Functions

Master Convex functions including queries, mutations, actions, and HTTP endpoints with proper validation, error handling, and runtime considerations.

## Code Quality

All examples in this skill comply with @convex-dev/eslint-plugin rules:

- Object syntax with `handler` property
- Argument validators on all functions
- Explicit table names in database operations

See the Code Quality section in [convex-best-practices](../convex-best-practices/SKILL.md) for linting setup.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/functions
- Query Functions: https://docs.convex.dev/functions/query-functions
- Mutation Functions: https://docs.convex.dev/functions/mutation-functions
- Actions: https://docs.convex.dev/functions/actions
- HTTP Actions: https://docs.convex.dev/functions/http-actions
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### Function Types Overview

| Type        | Database Access          | External APIs | Caching       | Use Case              |
| ----------- | ------------------------ | ------------- | ------------- | --------------------- |
| Query       | Read-only                | No            | Yes, reactive | Fetching data         |
| Mutation    | Read/Write               | No            | No            | Modifying data        |
| Action      | Via runQuery/runMutation | Yes           | No            | External integrations |
| HTTP Action | Via runQuery/runMutation | Yes           | No            | Webhooks, APIs        |

### Queries

Queries are reactive, cached, and read-only:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get("users", args.userId);
  },
});

// Query with index
export const listUserTasks = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
      title: v.string(),
      completed: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
```

### Mutations

Mutations modify the database and are transactional:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createTask = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    return await ctx.db.insert("tasks", {
      title: args.title,
      userId: args.userId,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete("tasks", args.taskId);
    return null;
  },
});
```

### Actions

Actions can call external APIs but have no direct database access:

```typescript
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Call external API
    const response = await fetch("https://api.email.com/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    return { success: response.ok };
  },
});

// Action calling queries and mutations
export const processOrder = action({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Read data via query
    const order = await ctx.runQuery(api.orders.get, { orderId: args.orderId });

    if (!order) {
      throw new Error("Order not found");
    }

    // Call external payment API
    const paymentResult = await processPayment(order);

    // Update database via mutation
    await ctx.runMutation(internal.orders.updateStatus, {
      orderId: args.orderId,
      status: paymentResult.success ? "paid" : "failed",
    });

    return null;
  },
});
```

### HTTP Actions

HTTP actions handle webhooks and external requests:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    // Verify webhook signature
    if (!verifyStripeSignature(body, signature)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    // Process webhook
    await ctx.runMutation(internal.payments.handleWebhook, {
      eventType: event.type,
      data: event.data,
    });

    return new Response("OK", { status: 200 });
  }),
});

// API endpoint
http.route({
  path: "/api/users/:userId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();

    const user = await ctx.runQuery(api.users.get, {
      userId: userId as Id<"users">,
    });

    if (!user) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json(user);
  }),
});

export default http;
```

### Internal Functions

Use internal functions for sensitive operations:

```typescript
import {
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";

// Only callable from other Convex functions
export const _updateUserCredits = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;

    await ctx.db.patch("users", args.userId, {
      credits: (user.credits || 0) + args.amount,
    });
    return null;
  },
});

// Call internal function from action
export const purchaseCredits = action({
  args: { userId: v.id("users"), amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Process payment externally
    await processPayment(args.amount);

    // Update credits via internal mutation
    await ctx.runMutation(internal.users._updateUserCredits, {
      userId: args.userId,
      amount: args.amount,
    });

    return null;
  },
});
```

### Scheduling Functions

Schedule functions to run later:

```typescript
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const scheduleReminder = mutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    delayMs: v.number(),
  },
  returns: v.id("_scheduled_functions"),
  handler: async (ctx, args) => {
    return await ctx.scheduler.runAfter(
      args.delayMs,
      internal.notifications.sendReminder,
      { userId: args.userId, message: args.message },
    );
  },
});

export const sendReminder = internalMutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      sentAt: Date.now(),
    });
    return null;
  },
});
```

## Examples

### Complete Function File

```typescript
// convex/messages.ts
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  channelId: v.id("channels"),
  authorId: v.id("users"),
  content: v.string(),
  editedAt: v.optional(v.number()),
});

// Public query
export const list = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(limit);
  },
});

// Public mutation
export const send = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    if (args.content.trim().length === 0) {
      throw new ConvexError("Message cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content.trim(),
    });

    // Schedule notification
    await ctx.scheduler.runAfter(0, internal.messages.notifySubscribers, {
      channelId: args.channelId,
      messageId,
    });

    return messageId;
  },
});

// Internal mutation
export const notifySubscribers = internalMutation({
  args: {
    channelId: v.id("channels"),
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get channel subscribers and notify them
    const subscribers = await ctx.db
      .query("subscriptions")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    for (const sub of subscribers) {
      await ctx.db.insert("notifications", {
        userId: sub.userId,
        messageId: args.messageId,
        read: false,
      });
    }
    return null;
  },
});
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Always define args and returns validators
- Use queries for read operations (they are cached and reactive)
- Use mutations for write operations (they are transactional)
- Use actions only when calling external APIs
- Use internal functions for sensitive operations
- Add `"use node";` at the top of action files using Node.js APIs
- Handle errors with ConvexError for user-facing messages

## Common Pitfalls

1. **Using actions for database operations** - Use queries/mutations instead
2. **Calling external APIs from queries/mutations** - Use actions
3. **Forgetting to add "use node"** - Required for Node.js APIs in actions
4. **Missing return validators** - Always specify returns
5. **Not using internal functions for sensitive logic** - Protect with internalMutation

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- Functions Overview: https://docs.convex.dev/functions
- Query Functions: https://docs.convex.dev/functions/query-functions
- Mutation Functions: https://docs.convex.dev/functions/mutation-functions
- Actions: https://docs.convex.dev/functions/actions

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-functions
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-functions/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-functions/assets/large-logo.png</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-functions/assets/small-logo.svg</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "convex-schema-validator"
}
```

**Output:**
```
<skill_content name="convex-schema-validator">
# Skill: convex-schema-validator

# Convex Schema Validator

Define and validate database schemas in Convex with proper typing, index configuration, optional fields, unions, and strategies for schema migrations.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/database/schemas
- Indexes: https://docs.convex.dev/database/indexes
- Data Types: https://docs.convex.dev/database/types
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### Basic Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }),
  
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    userId: v.id("users"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  }),
});
```

### Validator Types

| Validator | TypeScript Type | Example |
|-----------|----------------|---------|
| `v.string()` | `string` | `"hello"` |
| `v.number()` | `number` | `42`, `3.14` |
| `v.boolean()` | `boolean` | `true`, `false` |
| `v.null()` | `null` | `null` |
| `v.int64()` | `bigint` | `9007199254740993n` |
| `v.bytes()` | `ArrayBuffer` | Binary data |
| `v.id("table")` | `Id<"table">` | Document reference |
| `v.array(v)` | `T[]` | `[1, 2, 3]` |
| `v.object({})` | `{ ... }` | `{ name: "..." }` |
| `v.optional(v)` | `T \| undefined` | Optional field |
| `v.union(...)` | `T1 \| T2` | Multiple types |
| `v.literal(x)` | `"x"` | Exact value |
| `v.any()` | `any` | Any value |
| `v.record(k, v)` | `Record<K, V>` | Dynamic keys |

### Index Configuration

```typescript
export default defineSchema({
  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
    sentAt: v.number(),
  })
    // Single field index
    .index("by_channel", ["channelId"])
    // Compound index
    .index("by_channel_and_author", ["channelId", "authorId"])
    // Index for sorting
    .index("by_channel_and_time", ["channelId", "sentAt"]),
    
  // Full-text search index
  articles: defineTable({
    title: v.string(),
    body: v.string(),
    category: v.string(),
  })
    .searchIndex("search_content", {
      searchField: "body",
      filterFields: ["category"],
    }),
});
```

### Complex Types

```typescript
export default defineSchema({
  // Nested objects
  profiles: defineTable({
    userId: v.id("users"),
    settings: v.object({
      theme: v.union(v.literal("light"), v.literal("dark")),
      notifications: v.object({
        email: v.boolean(),
        push: v.boolean(),
      }),
    }),
  }),

  // Arrays of objects
  orders: defineTable({
    customerId: v.id("users"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
  }),

  // Record type for dynamic keys
  analytics: defineTable({
    date: v.string(),
    metrics: v.record(v.string(), v.number()),
  }),
});
```

### Discriminated Unions

```typescript
export default defineSchema({
  events: defineTable(
    v.union(
      v.object({
        type: v.literal("user_signup"),
        userId: v.id("users"),
        email: v.string(),
      }),
      v.object({
        type: v.literal("purchase"),
        userId: v.id("users"),
        orderId: v.id("orders"),
        amount: v.number(),
      }),
      v.object({
        type: v.literal("page_view"),
        sessionId: v.string(),
        path: v.string(),
      })
    )
  ).index("by_type", ["type"]),
});
```

### Optional vs Nullable Fields

```typescript
export default defineSchema({
  items: defineTable({
    // Optional: field may not exist
    description: v.optional(v.string()),
    
    // Nullable: field exists but can be null
    deletedAt: v.union(v.number(), v.null()),
    
    // Optional and nullable
    notes: v.optional(v.union(v.string(), v.null())),
  }),
});
```

### Index Naming Convention

Always include all indexed fields in the index name:

```typescript
export default defineSchema({
  posts: defineTable({
    authorId: v.id("users"),
    categoryId: v.id("categories"),
    publishedAt: v.number(),
    status: v.string(),
  })
    // Good: descriptive names
    .index("by_author", ["authorId"])
    .index("by_author_and_category", ["authorId", "categoryId"])
    .index("by_category_and_status", ["categoryId", "status"])
    .index("by_status_and_published", ["status", "publishedAt"]),
});
```

### Schema Migration Strategies

#### Adding New Fields

```typescript
// Before
users: defineTable({
  name: v.string(),
  email: v.string(),
})

// After - add as optional first
users: defineTable({
  name: v.string(),
  email: v.string(),
  avatarUrl: v.optional(v.string()), // New optional field
})
```

#### Backfilling Data

```typescript
// convex/migrations.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const backfillAvatars = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("avatarUrl"), undefined))
      .take(100);

    for (const user of users) {
      await ctx.db.patch(user._id, {
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`,
      });
    }

    return users.length;
  },
});
```

#### Making Optional Fields Required

```typescript
// Step 1: Backfill all null values
// Step 2: Update schema to required
users: defineTable({
  name: v.string(),
  email: v.string(),
  avatarUrl: v.string(), // Now required after backfill
})
```

## Examples

### Complete E-commerce Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("customer"), v.literal("admin")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    inventory: v.number(),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_active_and_category", ["isActive", "category"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["category", "isActive"],
    }),

  orders: defineTable({
    userId: v.id("users"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      priceAtPurchase: v.number(),
    })),
    total: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
      country: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),
});
```

### Using Schema Types in Functions

```typescript
// convex/products.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Use Doc type for full documents
type Product = Doc<"products">;

// Use Id type for references
type ProductId = Id<"products">;

export const get = query({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      price: v.number(),
      category: v.string(),
      inventory: v.number(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args): Promise<Product | null> => {
    return await ctx.db.get(args.productId);
  },
});
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Always define explicit schemas rather than relying on inference
- Use descriptive index names that include all indexed fields
- Start with optional fields when adding new columns
- Use discriminated unions for polymorphic data
- Validate data at the schema level, not just in functions
- Plan index strategy based on query patterns

## Common Pitfalls

1. **Missing indexes for queries** - Every withIndex needs a corresponding schema index
2. **Wrong index field order** - Fields must be queried in order defined
3. **Using v.any() excessively** - Lose type safety benefits
4. **Not making new fields optional** - Breaks existing data
5. **Forgetting system fields** - _id and _creationTime are automatic

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- Schemas: https://docs.convex.dev/database/schemas
- Indexes: https://docs.convex.dev/database/indexes
- Data Types: https://docs.convex.dev/database/types

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-schema-validator
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-schema-validator/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-schema-validator/assets/small-logo.svg</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-schema-validator/assets/large-logo.png</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "convex-agents"
}
```

**Output:**
```
<skill_content name="convex-agents">
# Skill: convex-agents

# Convex Agents

Build persistent, stateful AI agents with Convex including thread management, tool integration, streaming responses, RAG patterns, and workflow orchestration.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/ai
- Convex Agent Component: https://www.npmjs.com/package/@convex-dev/agent
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### Why Convex for AI Agents

- **Persistent State** - Conversation history survives restarts
- **Real-time Updates** - Stream responses to clients automatically
- **Tool Execution** - Run Convex functions as agent tools
- **Durable Workflows** - Long-running agent tasks with reliability
- **Built-in RAG** - Vector search for knowledge retrieval

### Setting Up Convex Agent

```bash
npm install @convex-dev/agent ai openai
```

```typescript
// convex/agent.ts
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { OpenAI } from "openai";

const openai = new OpenAI();

export const agent = new Agent(components.agent, {
  chat: openai.chat,
  textEmbedding: openai.embeddings,
});
```

### Thread Management

```typescript
// convex/threads.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { agent } from "./agent";

// Create a new conversation thread
export const createThread = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const threadId = await agent.createThread(ctx, {
      userId: args.userId,
      metadata: {
        title: args.title ?? "New Conversation",
        createdAt: Date.now(),
      },
    });
    return threadId;
  },
});

// List user's threads
export const listThreads = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("threads"),
    title: v.string(),
    lastMessageAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await agent.listThreads(ctx, {
      userId: args.userId,
    });
  },
});

// Get thread messages
export const getMessages = query({
  args: { threadId: v.id("threads") },
  returns: v.array(v.object({
    role: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await agent.getMessages(ctx, {
      threadId: args.threadId,
    });
  },
});
```

### Sending Messages and Streaming Responses

```typescript
// convex/chat.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { agent } from "./agent";
import { internal } from "./_generated/api";

export const sendMessage = action({
  args: {
    threadId: v.id("threads"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Add user message to thread
    await ctx.runMutation(internal.chat.addUserMessage, {
      threadId: args.threadId,
      content: args.message,
    });

    // Generate AI response with streaming
    const response = await agent.chat(ctx, {
      threadId: args.threadId,
      messages: [{ role: "user", content: args.message }],
      stream: true,
      onToken: async (token) => {
        // Stream tokens to client via mutation
        await ctx.runMutation(internal.chat.appendToken, {
          threadId: args.threadId,
          token,
        });
      },
    });

    // Save complete response
    await ctx.runMutation(internal.chat.saveResponse, {
      threadId: args.threadId,
      content: response.content,
    });

    return null;
  },
});
```

### Tool Integration

Define tools that agents can use:

```typescript
// convex/tools.ts
import { tool } from "@convex-dev/agent";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Tool to search knowledge base
export const searchKnowledge = tool({
  name: "search_knowledge",
  description: "Search the knowledge base for relevant information",
  parameters: v.object({
    query: v.string(),
    limit: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const results = await ctx.runQuery(api.knowledge.search, {
      query: args.query,
      limit: args.limit ?? 5,
    });
    return results;
  },
});

// Tool to create a task
export const createTask = tool({
  name: "create_task",
  description: "Create a new task for the user",
  parameters: v.object({
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const taskId = await ctx.runMutation(api.tasks.create, {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate ? new Date(args.dueDate).getTime() : undefined,
    });
    return { success: true, taskId };
  },
});

// Tool to get weather
export const getWeather = tool({
  name: "get_weather",
  description: "Get current weather for a location",
  parameters: v.object({
    location: v.string(),
  }),
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://api.weather.com/current?location=${encodeURIComponent(args.location)}`
    );
    return await response.json();
  },
});
```

### Agent with Tools

```typescript
// convex/assistant.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { agent } from "./agent";
import { searchKnowledge, createTask, getWeather } from "./tools";

export const chat = action({
  args: {
    threadId: v.id("threads"),
    message: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const response = await agent.chat(ctx, {
      threadId: args.threadId,
      messages: [{ role: "user", content: args.message }],
      tools: [searchKnowledge, createTask, getWeather],
      systemPrompt: `You are a helpful assistant. You have access to tools to:
        - Search the knowledge base for information
        - Create tasks for the user
        - Get weather information
        Use these tools when appropriate to help the user.`,
    });

    return response.content;
  },
});
```

### RAG (Retrieval Augmented Generation)

```typescript
// convex/knowledge.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { agent } from "./agent";

// Add document to knowledge base
export const addDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.object({
      source: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    // Generate embedding
    const embedding = await agent.embed(ctx, args.content);

    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      embedding,
      metadata: args.metadata ?? {},
      createdAt: Date.now(),
    });
  },
});

// Search knowledge base
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("documents"),
    title: v.string(),
    content: v.string(),
    score: v.number(),
  })),
  handler: async (ctx, args) => {
    const results = await agent.search(ctx, {
      query: args.query,
      table: "documents",
      limit: args.limit ?? 5,
    });

    return results.map((r) => ({
      _id: r._id,
      title: r.title,
      content: r.content,
      score: r._score,
    }));
  },
});
```

### Workflow Orchestration

```typescript
// convex/workflows.ts
import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { agent } from "./agent";
import { internal } from "./_generated/api";

// Multi-step research workflow
export const researchTopic = action({
  args: {
    topic: v.string(),
    userId: v.id("users"),
  },
  returns: v.id("research"),
  handler: async (ctx, args) => {
    // Create research record
    const researchId = await ctx.runMutation(internal.workflows.createResearch, {
      topic: args.topic,
      userId: args.userId,
      status: "searching",
    });

    // Step 1: Search for relevant documents
    const searchResults = await agent.search(ctx, {
      query: args.topic,
      table: "documents",
      limit: 10,
    });

    await ctx.runMutation(internal.workflows.updateStatus, {
      researchId,
      status: "analyzing",
    });

    // Step 2: Analyze and synthesize
    const analysis = await agent.chat(ctx, {
      messages: [{
        role: "user",
        content: `Analyze these sources about "${args.topic}" and provide a comprehensive summary:\n\n${
          searchResults.map((r) => r.content).join("\n\n---\n\n")
        }`,
      }],
      systemPrompt: "You are a research assistant. Provide thorough, well-cited analysis.",
    });

    // Step 3: Generate key insights
    await ctx.runMutation(internal.workflows.updateStatus, {
      researchId,
      status: "summarizing",
    });

    const insights = await agent.chat(ctx, {
      messages: [{
        role: "user",
        content: `Based on this analysis, list 5 key insights:\n\n${analysis.content}`,
      }],
    });

    // Save final results
    await ctx.runMutation(internal.workflows.completeResearch, {
      researchId,
      analysis: analysis.content,
      insights: insights.content,
      sources: searchResults.map((r) => r._id),
    });

    return researchId;
  },
});
```

## Examples

### Complete Chat Application Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    lastMessageAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    toolCalls: v.optional(v.array(v.object({
      name: v.string(),
      arguments: v.any(),
      result: v.optional(v.any()),
    }))),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.object({
      source: v.optional(v.string()),
      category: v.optional(v.string()),
    }),
    createdAt: v.number(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),
});
```

### React Chat Component

```typescript
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef, useEffect } from "react";

function ChatInterface({ threadId }: { threadId: Id<"threads"> }) {
  const messages = useQuery(api.threads.getMessages, { threadId });
  const sendMessage = useAction(api.chat.sendMessage);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const message = input.trim();
    setInput("");
    setSending(true);

    try {
      await sendMessage({ threadId, message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages?.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Store conversation history in Convex for persistence
- Use streaming for better user experience with long responses
- Implement proper error handling for tool failures
- Use vector indexes for efficient RAG retrieval
- Rate limit agent interactions to control costs
- Log tool usage for debugging and analytics

## Common Pitfalls

1. **Not persisting threads** - Conversations lost on refresh
2. **Blocking on long responses** - Use streaming instead
3. **Tool errors crashing agents** - Add proper error handling
4. **Large context windows** - Summarize old messages
5. **Missing embeddings for RAG** - Generate embeddings on insert

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- Convex AI: https://docs.convex.dev/ai
- Agent Component: https://www.npmjs.com/package/@convex-dev/agent

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-agents
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-agents/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-agents/assets/large-logo.png</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-agents/assets/small-logo.svg</file>
</skill_files>
</skill_content>
```

---

## Assistant (Plan · claude-opus-4.5 · 6.1s)

Now let me also load the remaining important skills for a complete backend plan:

**Tool: skill**

**Input:**
```json
{
  "name": "convex-file-storage"
}
```

**Output:**
```
<skill_content name="convex-file-storage">
# Skill: convex-file-storage

# Convex File Storage

Handle file uploads, storage, serving, and management in Convex applications with proper patterns for images, documents, and generated files.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/file-storage
- Upload Files: https://docs.convex.dev/file-storage/upload-files
- Serve Files: https://docs.convex.dev/file-storage/serve-files
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### File Storage Overview

Convex provides built-in file storage with:
- Automatic URL generation for serving files
- Support for any file type (images, PDFs, videos, etc.)
- File metadata via the `_storage` system table
- Integration with mutations and actions

### Generating Upload URLs

```typescript
// convex/files.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

### Client-Side Upload

```typescript
// React component
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function FileUploader() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Step 3: Save file reference to database
      await saveFile({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### Saving File References

```typescript
// convex/files.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
    });
  },
});
```

### Serving Files via URL

```typescript
// convex/files.ts
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get file with URL
export const getFile = query({
  args: { fileId: v.id("files") },
  returns: v.union(
    v.object({
      _id: v.id("files"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      url: v.union(v.string(), v.null()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;

    const url = await ctx.storage.getUrl(file.storageId);
    
    return {
      _id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      url,
    };
  },
});
```

### Displaying Files in React

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function FileDisplay({ fileId }: { fileId: Id<"files"> }) {
  const file = useQuery(api.files.getFile, { fileId });

  if (!file) return <div>Loading...</div>;
  if (!file.url) return <div>File not found</div>;

  // Handle different file types
  if (file.fileType.startsWith("image/")) {
    return <img src={file.url} alt={file.fileName} />;
  }

  if (file.fileType === "application/pdf") {
    return (
      <iframe
        src={file.url}
        title={file.fileName}
        width="100%"
        height="600px"
      />
    );
  }

  return (
    <a href={file.url} download={file.fileName}>
      Download {file.fileName}
    </a>
  );
}
```

### Storing Generated Files from Actions

```typescript
// convex/generate.ts
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generatePDF = action({
  args: { content: v.string() },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Generate PDF (example using a library)
    const pdfBuffer = await generatePDFFromContent(args.content);

    // Convert to Blob
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    // Store in Convex
    const storageId = await ctx.storage.store(blob);

    return storageId;
  },
});

// Generate and save image
export const generateImage = action({
  args: { prompt: v.string() },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Call external API to generate image
    const response = await fetch("https://api.example.com/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: args.prompt }),
    });

    const imageBuffer = await response.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: "image/png" });

    return await ctx.storage.store(blob);
  },
});
```

### Accessing File Metadata

```typescript
// convex/files.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

type FileMetadata = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const metadata = await ctx.db.system.get(args.storageId);
    return metadata as FileMetadata | null;
  },
});
```

### Deleting Files

```typescript
// convex/files.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete database record
    await ctx.db.delete(args.fileId);

    return null;
  },
});
```

### Image Upload with Preview

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef } from "react";

function ImageUploader({ onUpload }: { onUpload: (id: Id<"files">) => void }) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      const fileId = await saveFile({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      onUpload(fileId);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Select Image"}
      </button>

      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ maxWidth: 200, marginTop: 10 }}
        />
      )}
    </div>
  );
}
```

## Examples

### Schema for File Storage

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_user", ["uploadedBy"])
    .index("by_type", ["fileType"]),

  // User avatars
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
  }),

  // Posts with images
  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_author", ["authorId"]),
});
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Validate file types and sizes on the client before uploading
- Store file metadata (name, type, size) in your own table
- Use the `_storage` system table only for Convex metadata
- Delete storage files when deleting database references
- Use appropriate Content-Type headers when uploading
- Consider image optimization for large images

## Common Pitfalls

1. **Not setting Content-Type header** - Files may not serve correctly
2. **Forgetting to delete storage** - Orphaned files waste storage
3. **Not validating file types** - Security risk for malicious uploads
4. **Large file uploads without progress** - Poor UX for users
5. **Using deprecated getMetadata** - Use ctx.db.system.get instead

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- File Storage: https://docs.convex.dev/file-storage
- Upload Files: https://docs.convex.dev/file-storage/upload-files
- Serve Files: https://docs.convex.dev/file-storage/serve-files

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-file-storage
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-file-storage/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-file-storage/assets/large-logo.png</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-file-storage/assets/small-logo.svg</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "convex-cron-jobs"
}
```

**Output:**
```
<skill_content name="convex-cron-jobs">
# Skill: convex-cron-jobs

# Convex Cron Jobs

Schedule recurring functions for background tasks, cleanup jobs, data syncing, and automated workflows in Convex applications.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/scheduling/cron-jobs
- Scheduling Overview: https://docs.convex.dev/scheduling
- Scheduled Functions: https://docs.convex.dev/scheduling/scheduled-functions
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### Cron Jobs Overview

Convex cron jobs allow you to schedule functions to run at regular intervals or specific times. Key features:

- Run functions on a fixed schedule
- Support for interval-based and cron expression scheduling
- Automatic retries on failure
- Monitoring via the Convex dashboard

### Basic Cron Setup

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour
crons.interval(
  "cleanup expired sessions",
  { hours: 1 },
  internal.tasks.cleanupExpiredSessions,
  {}
);

// Run every day at midnight UTC
crons.cron(
  "daily report",
  "0 0 * * *",
  internal.reports.generateDailyReport,
  {}
);

export default crons;
```

### Interval-Based Scheduling

Use `crons.interval` for simple recurring tasks:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 5 minutes
crons.interval(
  "sync external data",
  { minutes: 5 },
  internal.sync.fetchExternalData,
  {}
);

// Every 2 hours
crons.interval(
  "cleanup temp files",
  { hours: 2 },
  internal.files.cleanupTempFiles,
  {}
);

// Every 30 seconds (minimum interval)
crons.interval(
  "health check",
  { seconds: 30 },
  internal.monitoring.healthCheck,
  {}
);

export default crons;
```

### Cron Expression Scheduling

Use `crons.cron` for precise scheduling with cron expressions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every day at 9 AM UTC
crons.cron(
  "morning notifications",
  "0 9 * * *",
  internal.notifications.sendMorningDigest,
  {}
);

// Every Monday at 8 AM UTC
crons.cron(
  "weekly summary",
  "0 8 * * 1",
  internal.reports.generateWeeklySummary,
  {}
);

// First day of every month at midnight
crons.cron(
  "monthly billing",
  "0 0 1 * *",
  internal.billing.processMonthlyBilling,
  {}
);

// Every 15 minutes
crons.cron(
  "frequent sync",
  "*/15 * * * *",
  internal.sync.syncData,
  {}
);

export default crons;
```

### Cron Expression Reference

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * *
```

Common patterns:
- `* * * * *` - Every minute
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month
- `*/5 * * * *` - Every 5 minutes
- `0 9-17 * * 1-5` - Every hour from 9 AM to 5 PM, Monday through Friday

### Internal Functions for Crons

Cron jobs should call internal functions for security:

```typescript
// convex/tasks.ts
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Cleanup expired sessions
export const cleanupExpiredSessions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const expiredSessions = await ctx.db
      .query("sessions")
      .withIndex("by_lastActive")
      .filter((q) => q.lt(q.field("lastActive"), oneHourAgo))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return expiredSessions.length;
  },
});

// Process pending tasks
export const processPendingTasks = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const pendingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(100);

    for (const task of pendingTasks) {
      await ctx.db.patch(task._id, {
        status: "processing",
        startedAt: Date.now(),
      });
      
      // Schedule the actual processing
      await ctx.scheduler.runAfter(0, internal.tasks.processTask, {
        taskId: task._id,
      });
    }

    return null;
  },
});
```

### Cron Jobs with Arguments

Pass static arguments to cron jobs:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Different cleanup intervals for different types
crons.interval(
  "cleanup temp files",
  { hours: 1 },
  internal.cleanup.cleanupByType,
  { fileType: "temp", maxAge: 3600000 }
);

crons.interval(
  "cleanup cache files",
  { hours: 24 },
  internal.cleanup.cleanupByType,
  { fileType: "cache", maxAge: 86400000 }
);

export default crons;
```

```typescript
// convex/cleanup.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const cleanupByType = internalMutation({
  args: {
    fileType: v.string(),
    maxAge: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.maxAge;
    
    const oldFiles = await ctx.db
      .query("files")
      .withIndex("by_type_and_created", (q) => 
        q.eq("type", args.fileType).lt("createdAt", cutoff)
      )
      .collect();

    for (const file of oldFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }

    return oldFiles.length;
  },
});
```

### Monitoring and Logging

Add logging to track cron job execution:

```typescript
// convex/tasks.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const cleanupWithLogging = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const startTime = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
      const expiredItems = await ctx.db
        .query("items")
        .withIndex("by_expiresAt")
        .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
        .collect();

      for (const item of expiredItems) {
        try {
          await ctx.db.delete(item._id);
          processedCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to delete item ${item._id}:`, error);
        }
      }

      // Log job completion
      await ctx.db.insert("cronLogs", {
        jobName: "cleanup",
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        processedCount,
        errorCount,
        status: errorCount === 0 ? "success" : "partial",
      });
    } catch (error) {
      // Log job failure
      await ctx.db.insert("cronLogs", {
        jobName: "cleanup",
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        processedCount,
        errorCount,
        status: "failed",
        error: String(error),
      });
      throw error;
    }

    return null;
  },
});
```

### Batching for Large Datasets

Handle large datasets in batches to avoid timeouts:

```typescript
// convex/tasks.ts
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const BATCH_SIZE = 100;

export const processBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null });

    for (const item of result.page) {
      await ctx.db.patch(item._id, {
        status: "processed",
        processedAt: Date.now(),
      });
    }

    // Schedule next batch if there are more items
    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.tasks.processBatch, {
        cursor: result.continueCursor,
      });
    }

    return null;
  },
});
```

### External API Calls in Crons

Use actions for external API calls:

```typescript
// convex/sync.ts
"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const syncExternalData = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Fetch from external API
    const response = await fetch("https://api.example.com/data", {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Store the data using a mutation
    await ctx.runMutation(internal.sync.storeExternalData, {
      data,
      syncedAt: Date.now(),
    });

    return null;
  },
});

export const storeExternalData = internalMutation({
  args: {
    data: v.any(),
    syncedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("externalData", {
      data: args.data,
      syncedAt: args.syncedAt,
    });
    return null;
  },
});
```

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync external data",
  { minutes: 15 },
  internal.sync.syncExternalData,
  {}
);

export default crons;
```

## Examples

### Schema for Cron Job Logging

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cronLogs: defineTable({
    jobName: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    processedCount: v.number(),
    errorCount: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  })
    .index("by_job", ["jobName"])
    .index("by_status", ["status"])
    .index("by_startTime", ["startTime"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    lastActive: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_lastActive", ["lastActive"])
    .index("by_expiresAt", ["expiresAt"]),

  tasks: defineTable({
    type: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    data: v.any(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_type_and_status", ["type", "status"]),
});
```

### Complete Cron Configuration Example

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Cleanup jobs
crons.interval(
  "cleanup expired sessions",
  { hours: 1 },
  internal.cleanup.expiredSessions,
  {}
);

crons.interval(
  "cleanup old logs",
  { hours: 24 },
  internal.cleanup.oldLogs,
  { maxAgeDays: 30 }
);

// Sync jobs
crons.interval(
  "sync user data",
  { minutes: 15 },
  internal.sync.userData,
  {}
);

// Report jobs
crons.cron(
  "daily analytics",
  "0 1 * * *",
  internal.reports.dailyAnalytics,
  {}
);

crons.cron(
  "weekly summary",
  "0 9 * * 1",
  internal.reports.weeklySummary,
  {}
);

// Health checks
crons.interval(
  "service health check",
  { minutes: 5 },
  internal.monitoring.healthCheck,
  {}
);

export default crons;
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Only use `crons.interval` or `crons.cron` methods, not deprecated helpers
- Always call internal functions from cron jobs for security
- Import `internal` from `_generated/api` even for functions in the same file
- Add logging and monitoring for production cron jobs
- Use batching for operations that process large datasets
- Handle errors gracefully to prevent job failures
- Use meaningful job names for dashboard visibility
- Consider timezone when using cron expressions (Convex uses UTC)

## Common Pitfalls

1. **Using public functions** - Cron jobs should call internal functions only
2. **Long-running mutations** - Break large operations into batches
3. **Missing error handling** - Unhandled errors will fail the entire job
4. **Forgetting timezone** - All cron expressions use UTC
5. **Using deprecated helpers** - Avoid `crons.hourly`, `crons.daily`, etc.
6. **Not logging execution** - Makes debugging production issues difficult

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- Cron Jobs: https://docs.convex.dev/scheduling/cron-jobs
- Scheduling Overview: https://docs.convex.dev/scheduling
- Scheduled Functions: https://docs.convex.dev/scheduling/scheduled-functions

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-cron-jobs
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-cron-jobs/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-cron-jobs/assets/large-logo.png</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-cron-jobs/assets/small-logo.svg</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "convex-http-actions"
}
```

**Output:**
```
<skill_content name="convex-http-actions">
# Skill: convex-http-actions

# Convex HTTP Actions

Build HTTP endpoints for webhooks, external API integrations, and custom routes in Convex applications.

## Documentation Sources

Before implementing, do not assume; fetch the latest documentation:

- Primary: https://docs.convex.dev/functions/http-actions
- Actions Overview: https://docs.convex.dev/functions/actions
- Authentication: https://docs.convex.dev/auth
- For broader context: https://docs.convex.dev/llms.txt

## Instructions

### HTTP Actions Overview

HTTP actions allow you to define HTTP endpoints in Convex that can:

- Receive webhooks from third-party services
- Create custom API routes
- Handle file uploads
- Integrate with external services
- Serve dynamic content

### Basic HTTP Router Setup

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Simple GET endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

### Request Handling

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Handle JSON body
http.route({
  path: "/api/data",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Parse JSON body
    const body = await request.json();
    
    // Access headers
    const authHeader = request.headers.get("Authorization");
    
    // Access URL parameters
    const url = new URL(request.url);
    const queryParam = url.searchParams.get("filter");

    return new Response(
      JSON.stringify({ received: body, filter: queryParam }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

// Handle form data
http.route({
  path: "/api/form",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");

    return new Response(
      JSON.stringify({ name, email }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

// Handle raw bytes
http.route({
  path: "/api/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const bytes = await request.bytes();
    const contentType = request.headers.get("Content-Type") ?? "application/octet-stream";
    
    // Store in Convex storage
    const blob = new Blob([bytes], { type: contentType });
    const storageId = await ctx.storage.store(blob);

    return new Response(
      JSON.stringify({ storageId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
```

### Path Parameters

Use path prefix matching for dynamic routes:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Match /api/users/* with pathPrefix
http.route({
  pathPrefix: "/api/users/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    // Extract user ID from path: /api/users/123 -> "123"
    const userId = url.pathname.replace("/api/users/", "");

    return new Response(
      JSON.stringify({ userId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
```

### CORS Configuration

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Handle preflight requests
http.route({
  path: "/api/data",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

// Actual endpoint with CORS
http.route({
  path: "/api/data",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    return new Response(
      JSON.stringify({ success: true, data: body }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }),
});

export default http;
```

### Webhook Handling

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Stripe webhook
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await request.text();

    // Verify webhook signature (in action with Node.js)
    try {
      await ctx.runAction(internal.stripe.verifyAndProcessWebhook, {
        body,
        signature,
      });
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Webhook error", { status: 400 });
    }
  }),
});

// GitHub webhook
http.route({
  path: "/webhooks/github",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = request.headers.get("X-GitHub-Event");
    const signature = request.headers.get("X-Hub-Signature-256");
    
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await request.text();

    await ctx.runAction(internal.github.processWebhook, {
      event: event ?? "unknown",
      body,
      signature,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

### Webhook Signature Verification

```typescript
// convex/stripe.ts
"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const verifyAndProcessWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Verify signature
    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      webhookSecret
    );

    // Process based on event type
    switch (event.type) {
      case "checkout.session.completed":
        await ctx.runMutation(internal.payments.handleCheckoutComplete, {
          sessionId: event.data.object.id,
          customerId: event.data.object.customer as string,
        });
        break;

      case "customer.subscription.updated":
        await ctx.runMutation(internal.subscriptions.handleUpdate, {
          subscriptionId: event.data.object.id,
          status: event.data.object.status,
        });
        break;
    }

    return null;
  },
});
```

### Authentication in HTTP Actions

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// API key authentication
http.route({
  path: "/api/protected",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const apiKey = request.headers.get("X-API-Key");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate API key
    const isValid = await ctx.runQuery(internal.auth.validateApiKey, {
      apiKey,
    });

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process authenticated request
    const data = await ctx.runQuery(internal.data.getProtectedData, {});

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Bearer token authentication
http.route({
  path: "/api/user",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.slice(7);

    // Validate token and get user
    const user = await ctx.runQuery(internal.auth.validateToken, { token });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(user),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
```

### Calling Mutations and Queries

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/items",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    // Call a mutation
    const itemId = await ctx.runMutation(internal.items.create, {
      name: body.name,
      description: body.description,
    });

    // Query the created item
    const item = await ctx.runQuery(internal.items.get, { id: itemId });

    return new Response(
      JSON.stringify(item),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }),
});

http.route({
  path: "/api/items",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "10");

    const items = await ctx.runQuery(internal.items.list, { limit });

    return new Response(
      JSON.stringify(items),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
```

### Error Handling

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Helper for JSON responses
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper for error responses
function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

http.route({
  path: "/api/process",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Validate content type
      const contentType = request.headers.get("Content-Type");
      if (!contentType?.includes("application/json")) {
        return errorResponse("Content-Type must be application/json", 415);
      }

      // Parse body
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }

      // Validate required fields
      if (!body.data) {
        return errorResponse("Missing required field: data", 400);
      }

      // Process request
      const result = await ctx.runMutation(internal.process.handle, {
        data: body.data,
      });

      return jsonResponse({ success: true, result }, 200);
    } catch (error) {
      console.error("Processing error:", error);
      return errorResponse("Internal server error", 500);
    }
  }),
});

export default http;
```

### File Downloads

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  pathPrefix: "/files/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const fileId = url.pathname.replace("/files/", "") as Id<"_storage">;

    // Get file URL from storage
    const fileUrl = await ctx.storage.getUrl(fileId);

    if (!fileUrl) {
      return new Response("File not found", { status: 404 });
    }

    // Redirect to the file URL
    return Response.redirect(fileUrl, 302);
  }),
});

export default http;
```

## Examples

### Complete Webhook Integration

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Clerk webhook for user sync
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    const body = await request.text();

    try {
      await ctx.runAction(internal.clerk.verifyAndProcess, {
        body,
        svixId,
        svixTimestamp,
        svixSignature,
      });
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Clerk webhook error:", error);
      return new Response("Webhook verification failed", { status: 400 });
    }
  }),
});

export default http;
```

```typescript
// convex/clerk.ts
"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Webhook } from "svix";

export const verifyAndProcess = internalAction({
  args: {
    body: v.string(),
    svixId: v.string(),
    svixTimestamp: v.string(),
    svixSignature: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
    const wh = new Webhook(webhookSecret);

    const event = wh.verify(args.body, {
      "svix-id": args.svixId,
      "svix-timestamp": args.svixTimestamp,
      "svix-signature": args.svixSignature,
    }) as { type: string; data: Record<string, unknown> };

    switch (event.type) {
      case "user.created":
        await ctx.runMutation(internal.users.create, {
          clerkId: event.data.id as string,
          email: (event.data.email_addresses as Array<{ email_address: string }>)[0]?.email_address,
          name: `${event.data.first_name} ${event.data.last_name}`,
        });
        break;

      case "user.updated":
        await ctx.runMutation(internal.users.update, {
          clerkId: event.data.id as string,
          email: (event.data.email_addresses as Array<{ email_address: string }>)[0]?.email_address,
          name: `${event.data.first_name} ${event.data.last_name}`,
        });
        break;

      case "user.deleted":
        await ctx.runMutation(internal.users.remove, {
          clerkId: event.data.id as string,
        });
        break;
    }

    return null;
  },
});
```

### Schema for HTTP API

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  apiKeys: defineTable({
    key: v.string(),
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_user", ["userId"]),

  webhookEvents: defineTable({
    source: v.string(),
    eventType: v.string(),
    payload: v.any(),
    processedAt: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  })
    .index("by_source", ["source"])
    .index("by_status", ["status"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
});
```

## Best Practices

- Never run `npx convex deploy` unless explicitly instructed
- Never run any git commands unless explicitly instructed
- Always validate and sanitize incoming request data
- Use internal functions for database operations
- Implement proper error handling with appropriate status codes
- Add CORS headers for browser-accessible endpoints
- Verify webhook signatures before processing
- Log webhook events for debugging
- Use environment variables for secrets
- Handle timeouts gracefully

## Common Pitfalls

1. **Missing CORS preflight handler** - Browsers send OPTIONS requests first
2. **Not validating webhook signatures** - Security vulnerability
3. **Exposing internal functions** - Use internal functions from HTTP actions
4. **Forgetting Content-Type headers** - Clients may not parse responses correctly
5. **Not handling request body errors** - Invalid JSON will throw
6. **Blocking on long operations** - Use scheduled functions for heavy processing

## References

- Convex Documentation: https://docs.convex.dev/
- Convex LLMs.txt: https://docs.convex.dev/llms.txt
- HTTP Actions: https://docs.convex.dev/functions/http-actions
- Actions: https://docs.convex.dev/functions/actions
- Authentication: https://docs.convex.dev/auth

Base directory for this skill: file:///home/sones/projects/monorepo/.agents/skills/convex-http-actions
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/home/sones/projects/monorepo/.agents/skills/convex-http-actions/agents/openai.yaml</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-http-actions/assets/small-logo.svg</file>
<file>/home/sones/projects/monorepo/.agents/skills/convex-http-actions/assets/large-logo.png</file>
</skill_files>
</skill_content>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.7s)

Now let me read the current existing schema and backend structure to understand what's already in place:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/schema.ts"
}
```

**Output:**
```
<file>
00001| import { defineSchema, defineTable } from "convex/server";
00002| import { v } from "convex/values";
00003| 
00004| // ============================================================================
00005| // SHARED VALIDATORS (exported for reuse in functions)
00006| // ============================================================================
00007| 
00008| /** APCS user roles */
00009| export const apcsRoleValidator = v.union(
00010|   v.literal("port_admin"),
00011|   v.literal("terminal_operator"),
00012|   v.literal("carrier")
00013| );
00014| 
00015| /** Booking status lifecycle */
00016| export const bookingStatusValidator = v.union(
00017|   v.literal("pending"),
00018|   v.literal("confirmed"),
00019|   v.literal("rejected"),
00020|   v.literal("consumed"),
00021|   v.literal("cancelled"),
00022|   v.literal("expired")
00023| );
00024| 
00025| /** Truck size/weight class */
00026| export const truckClassValidator = v.union(
00027|   v.literal("light"), // < 3.5t
00028|   v.literal("medium"), // 3.5t - 7.5t
00029|   v.literal("heavy"), // 7.5t - 18t
00030|   v.literal("super_heavy") // > 18t
00031| );
00032| 
00033| /** Truck type */
00034| export const truckTypeValidator = v.union(
00035|   v.literal("container"),
00036|   v.literal("flatbed"),
00037|   v.literal("tanker"),
00038|   v.literal("refrigerated"),
00039|   v.literal("bulk"),
00040|   v.literal("general")
00041| );
00042| 
00043| /** Notification type */
00044| export const notificationTypeValidator = v.union(
00045|   v.literal("booking_created"),
00046|   v.literal("booking_confirmed"),
00047|   v.literal("booking_rejected"),
00048|   v.literal("booking_cancelled"),
00049|   v.literal("booking_modified"),
00050|   v.literal("booking_reminder"),
00051|   v.literal("booking_expired"),
00052|   v.literal("capacity_alert"),
00053|   v.literal("system_announcement")
00054| );
00055| 
00056| /** Notification channel */
00057| export const notificationChannelValidator = v.union(
00058|   v.literal("in_app"),
00059|   v.literal("email"),
00060|   v.literal("both")
00061| );
00062| 
00063| /** Language preference */
00064| export const languageValidator = v.union(v.literal("en"), v.literal("fr"));
00065| 
00066| /** Booking history change types */
00067| export const bookingChangeTypeValidator = v.union(
00068|   v.literal("created"),
00069|   v.literal("status_changed"),
00070|   v.literal("time_slot_changed"),
00071|   v.literal("truck_changed"),
00072|   v.literal("driver_updated"),
00073|   v.literal("details_updated")
00074| );
00075| 
00076| // ============================================================================
00077| // SCHEMA DEFINITION
00078| // ============================================================================
00079| 
00080| export default defineSchema({
00081|   // --------------------------------------------------------------------------
00082|   // TERMINALS & GATES
00083|   // --------------------------------------------------------------------------
00084| 
00085|   /**
00086|    * Terminals - Physical port terminals
00087|    * Created by: port_admin
00088|    */
00089|   terminals: defineTable({
00090|     name: v.string(),
00091|     code: v.string(), // Unique terminal code (e.g., "TRM-001")
00092|     address: v.optional(v.string()),
00093|     timezone: v.string(), // e.g., "America/New_York"
00094|     isActive: v.boolean(),
00095|     createdAt: v.number(),
00096|     updatedAt: v.number(),
00097|     createdBy: v.string(), // Better Auth user ID (stored as string)
00098|   })
00099|     .index("by_code", ["code"])
00100|     .index("by_active", ["isActive"])
00101|     .index("by_created_by", ["createdBy"]),
00102| 
00103|   /**
00104|    * Gates - Entry points at terminals with capacity
00105|    * Created by: port_admin or terminal_operator
00106|    */
00107|   gates: defineTable({
00108|     terminalId: v.id("terminals"),
00109|     name: v.string(),
00110|     code: v.string(), // e.g., "GATE-A1"
00111|     description: v.optional(v.string()),
00112|     isActive: v.boolean(),
00113|     // Default capacity (can be overridden per time slot)
00114|     defaultCapacity: v.number(),
00115|     // Allowed truck types at this gate
00116|     allowedTruckTypes: v.array(truckTypeValidator),
00117|     // Allowed truck classes at this gate
00118|     allowedTruckClasses: v.array(truckClassValidator),
00119|     createdAt: v.number(),
00120|     updatedAt: v.number(),
00121|     createdBy: v.string(), // Better Auth user ID
00122|   })
00123|     .index("by_terminal", ["terminalId"])
00124|     .index("by_terminal_and_active", ["terminalId", "isActive"])
00125|     .index("by_code", ["code"]),
00126| 
00127|   /**
00128|    * TimeSlots - Bookable time windows per gate
00129|    * Non-overlapping within the same gate
00130|    */
00131|   timeSlots: defineTable({
00132|     gateId: v.id("gates"),
00133|     // Date as YYYY-MM-DD string for easy indexing
00134|     date: v.string(),
00135|     startTime: v.string(), // HH:mm format (24h)
00136|     endTime: v.string(), // HH:mm format (24h)
00137|     // Max trucks allowed in this slot (overrides gate default if set)
00138|     maxCapacity: v.number(),
00139|     // Calculated field - updated on booking changes
00140|     currentBookings: v.number(),
00141|     isActive: v.boolean(),
00142|     createdAt: v.number(),
00143|     updatedAt: v.number(),
00144|     createdBy: v.string(), // Better Auth user ID
00145|   })
00146|     .index("by_gate", ["gateId"])
00147|     .index("by_gate_and_date", ["gateId", "date"])
00148|     .index("by_date", ["date"])
00149|     .index("by_gate_and_active", ["gateId", "isActive"]),
00150| 
00151|   // --------------------------------------------------------------------------
00152|   // TERMINAL OPERATOR ASSIGNMENTS (Many-to-Many)
00153|   // --------------------------------------------------------------------------
00154| 
00155|   /**
00156|    * TerminalOperatorAssignments - Links operators to terminals
00157|    * An operator can manage multiple terminals
00158|    */
00159|   terminalOperatorAssignments: defineTable({
00160|     userId: v.string(), // Better Auth user ID (with terminal_operator role)
00161|     terminalId: v.id("terminals"),
00162|     assignedAt: v.number(),
00163|     assignedBy: v.string(), // port_admin who made the assignment
00164|     isActive: v.boolean(),
00165|   })
00166|     .index("by_user", ["userId"])
00167|     .index("by_user_and_active", ["userId", "isActive"])
00168|     .index("by_terminal", ["terminalId"])
00169|     .index("by_terminal_and_active", ["terminalId", "isActive"])
00170|     .index("by_user_and_terminal", ["userId", "terminalId"]),
00171| 
00172|   // --------------------------------------------------------------------------
00173|   // CARRIER COMPANIES & TRUCKS
00174|   // --------------------------------------------------------------------------
00175| 
00176|   /**
00177|    * CarrierCompanies - Organizations that own trucks
00178|    * Created by: port_admin or self-registered
00179|    */
00180|   carrierCompanies: defineTable({
00181|     name: v.string(),
00182|     code: v.string(), // Unique company code
00183|     taxId: v.optional(v.string()), // Business registration number
00184|     address: v.optional(v.string()),
00185|     phone: v.optional(v.string()),
00186|     email: v.optional(v.string()),
00187|     isActive: v.boolean(),
00188|     // Notification preferences
00189|     preferredLanguage: languageValidator,
00190|     notificationChannel: notificationChannelValidator,
00191|     createdAt: v.number(),
00192|     updatedAt: v.number(),
00193|     createdBy: v.string(), // Better Auth user ID
00194|   })
00195|     .index("by_code", ["code"])
00196|     .index("by_active", ["isActive"])
00197|     .index("by_name", ["name"]),
00198| 
00199|   /**
00200|    * CarrierUsers - Links Better Auth users to carrier companies
00201|    * A user with 'carrier' role belongs to exactly one company
00202|    */
00203|   carrierUsers: defineTable({
00204|     userId: v.string(), // Better Auth user ID
00205|     carrierCompanyId: v.id("carrierCompanies"),
00206|     isCompanyAdmin: v.boolean(), // Can manage company's trucks/bookings
00207|     joinedAt: v.number(),
00208|     invitedBy: v.optional(v.string()), // Optional for self-registered founders
00209|     isActive: v.boolean(),
00210|   })
00211|     .index("by_user", ["userId"])
00212|     .index("by_company", ["carrierCompanyId"])
00213|     .index("by_company_and_active", ["carrierCompanyId", "isActive"]),
00214| 
00215|   /**
00216|    * Trucks - Vehicles owned by carrier companies
00217|    */
00218|   trucks: defineTable({
00219|     carrierCompanyId: v.id("carrierCompanies"),
00220|     licensePlate: v.string(),
00221|     // Truck classification
00222|     truckType: truckTypeValidator,
00223|     truckClass: truckClassValidator,
00224|     // Additional info
00225|     make: v.optional(v.string()),
00226|     model: v.optional(v.string()),
00227|     year: v.optional(v.number()),
00228|     // Capacity in tons
00229|     maxWeight: v.optional(v.number()),
00230|     isActive: v.boolean(),
00231|     createdAt: v.number(),
00232|     updatedAt: v.number(),
00233|     createdBy: v.string(), // Better Auth user ID
00234|   })
00235|     .index("by_carrier", ["carrierCompanyId"])
00236|     .index("by_carrier_and_active", ["carrierCompanyId", "isActive"])
00237|     .index("by_license_plate", ["licensePlate"])
00238|     .index("by_type", ["truckType"])
00239|     .index("by_class", ["truckClass"]),
00240| 
00241|   // --------------------------------------------------------------------------
00242|   // BOOKINGS
00243|   // --------------------------------------------------------------------------
00244| 
00245|   /**
00246|    * Bookings - Truck time slot reservations
00247|    * Full lifecycle: pending -> confirmed/rejected -> consumed/cancelled/expired
00248|    */
00249|   bookings: defineTable({
00250|     // References
00251|     timeSlotId: v.id("timeSlots"),
00252|     truckId: v.id("trucks"),
00253|     carrierCompanyId: v.id("carrierCompanies"),
00254|     // Denormalized for efficient queries
00255|     gateId: v.id("gates"),
00256|     terminalId: v.id("terminals"),
00257|     // Booking details
00258|     bookingReference: v.string(), // Human-readable reference (e.g., "BK-20240115-001")
00259|     status: bookingStatusValidator,
00260|     // QR code data (stored as data URL or external URL)
00261|     qrCode: v.optional(v.string()),
00262|     // Driver info (optional, can be added later)
00263|     driverName: v.optional(v.string()),
00264|     driverPhone: v.optional(v.string()),
00265|     driverIdNumber: v.optional(v.string()),
00266|     // Container/cargo info
00267|     containerNumber: v.optional(v.string()),
00268|     cargoDescription: v.optional(v.string()),
00269|     // Timestamps
00270|     bookedAt: v.number(),
00271|     confirmedAt: v.optional(v.number()),
00272|     rejectedAt: v.optional(v.number()),
00273|     cancelledAt: v.optional(v.number()),
00274|     consumedAt: v.optional(v.number()),
00275|     // Rejection/cancellation reason
00276|     statusReason: v.optional(v.string()),
00277|     // Who processed this booking (operator who confirmed/rejected)
00278|     processedBy: v.optional(v.string()), // Better Auth user ID
00279|     // Booking creator
00280|     createdBy: v.string(), // Better Auth user ID
00281|     updatedAt: v.number(),
00282|   })
00283|     .index("by_reference", ["bookingReference"])
00284|     .index("by_time_slot", ["timeSlotId"])
00285|     .index("by_time_slot_and_status", ["timeSlotId", "status"])
00286|     .index("by_truck", ["truckId"])
00287|     .index("by_carrier", ["carrierCompanyId"])
00288|     .index("by_carrier_and_status", ["carrierCompanyId", "status"])
00289|     .index("by_terminal", ["terminalId"])
00290|     .index("by_terminal_and_status", ["terminalId", "status"])
00291|     .index("by_gate", ["gateId"])
00292|     .index("by_gate_and_status", ["gateId", "status"])
00293|     .index("by_status", ["status"])
00294|     .index("by_created_by", ["createdBy"]),
00295| 
00296|   /**
00297|    * BookingHistory - Audit trail for all booking changes
00298|    * Immutable log of all modifications
00299|    */
00300|   bookingHistory: defineTable({
00301|     bookingId: v.id("bookings"),
00302|     // What changed
00303|     changeType: bookingChangeTypeValidator,
00304|     // Previous and new values (JSON strings for flexibility)
00305|     previousValue: v.optional(v.string()),
00306|     newValue: v.string(),
00307|     // Change metadata
00308|     changedAt: v.number(),
00309|     changedBy: v.string(), // Better Auth user ID
00310|     // Optional note explaining the change
00311|     note: v.optional(v.string()),
00312|     // For capacity-affecting changes, track if rebook was required
00313|     requiredRebook: v.boolean(),
00314|   })
00315|     .index("by_booking", ["bookingId"])
00316|     .index("by_booking_and_type", ["bookingId", "changeType"])
00317|     .index("by_changed_by", ["changedBy"])
00318|     .index("by_changed_at", ["changedAt"]),
00319| 
00320|   // --------------------------------------------------------------------------
00321|   // NOTIFICATIONS
00322|   // --------------------------------------------------------------------------
00323| 
00324|   /**
00325|    * Notifications - In-app and email notifications
00326|    * Bilingual support (EN/FR)
00327|    */
00328|   notifications: defineTable({
00329|     // Recipient
00330|     userId: v.string(), // Better Auth user ID
00331|     // Notification type and content
00332|     type: notificationTypeValidator,
00333|     channel: notificationChannelValidator,
00334|     // Content (bilingual)
00335|     titleEn: v.string(),
00336|     titleFr: v.string(),
00337|     bodyEn: v.string(),
00338|     bodyFr: v.string(),
00339|     // Related entity (for deep linking)
00340|     relatedEntityType: v.optional(
00341|       v.union(
00342|         v.literal("booking"),
00343|         v.literal("terminal"),
00344|         v.literal("time_slot")
00345|       )
00346|     ),
00347|     relatedEntityId: v.optional(v.string()),
00348|     // Status
00349|     isRead: v.boolean(),
00350|     readAt: v.optional(v.number()),
00351|     // Email status (if channel includes email)
00352|     emailSent: v.optional(v.boolean()),
00353|     emailSentAt: v.optional(v.number()),
00354|     emailError: v.optional(v.string()),
00355|     // Timestamps
00356|     createdAt: v.number(),
00357|   })
00358|     .index("by_user", ["userId"])
00359|     .index("by_user_and_read", ["userId", "isRead"])
00360|     .index("by_user_and_type", ["userId", "type"])
00361|     .index("by_created_at", ["createdAt"]),
00362| 
00363|   // --------------------------------------------------------------------------
00364|   // SYSTEM CONFIGURATION
00365|   // --------------------------------------------------------------------------
00366| 
00367|   /**
00368|    * SystemConfig - Global system settings
00369|    * Singleton table (should have only one document)
00370|    */
00371|   systemConfig: defineTable({
00372|     // Cancellation policy (-1 or 0 = disabled)
00373|     cancellationWindowHours: v.number(),
00374|     // Booking settings
00375|     maxAdvanceBookingDays: v.number(), // How far in advance can book
00376|     minAdvanceBookingHours: v.number(), // Minimum hours before slot
00377|     // Reminder settings
00378|     reminderHoursBefore: v.array(v.number()), // e.g., [24, 2] for 24h and 2h reminders
00379|     // Last updated
00380|     updatedAt: v.number(),
00381|     updatedBy: v.string(), // Better Auth user ID
00382|   }),
00383| 
00384|   // --------------------------------------------------------------------------
00385|   // USER PROFILE EXTENSION
00386|   // --------------------------------------------------------------------------
00387| 
00388|   /**
00389|    * UserProfiles - Extended user data beyond Better Auth
00390|    * One-to-one with Better Auth user table
00391|    * Note: apcsRole is now stored in Better Auth user table, not here
00392|    */
00393|   userProfiles: defineTable({
00394|     userId: v.string(), // Better Auth user ID
00395|     // User preferences
00396|     preferredLanguage: languageValidator,
00397|     notificationChannel: notificationChannelValidator,
00398|     // Phone for future SMS notifications
00399|     phone: v.optional(v.string()),
00400|     // Timestamps
00401|     createdAt: v.number(),
00402|     updatedAt: v.number(),
00403|   })
00404|     .index("by_user", ["userId"]),
00405| });
00406| 

(End of file - total 406 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/ai/agent.ts"
}
```

**Output:**
```
<file>
00001| "use node";
00002| /**
00003|  * APCS Agent Definition
00004|  *
00005|  * Main AI agent configured with Google Gemini.
00006|  * The agent uses role-based tools to interact with the port logistics system.
00007|  *
00008|  * All tools are registered at the agent level for full type safety.
00009|  * Role-based access control is enforced inside each tool handler
00010|  * (see tools/*.ts and checkToolAccess in tools/types.ts).
00011|  */
00012| import { google } from "@ai-sdk/google";
00013| import { Agent } from "@convex-dev/agent";
00014| import { components } from "../_generated/api";
00015| import { ALL_TOOLS } from "./registry";
00016| 
00017| // ============================================================================
00018| // AGENT
00019| // ============================================================================
00020| 
00021| /**
00022|  * The main APCS assistant agent.
00023|  *
00024|  * All tools are statically defined here for full type safety.
00025|  * Each tool internally checks the caller's role before returning data.
00026|  */
00027| export const apcsAgent = new Agent(components.agent, {
00028|   name: "APCS Assistant",
00029|   languageModel: google("gemini-2.0-flash"),
00030|   instructions: `You are the APCS (Advanced Port Container System) assistant.
00031| You help users manage port terminal operations, truck bookings, and logistics.
00032| 
00033| Key facts:
00034| - The system has terminals, each with gates. Gates have time slots for truck bookings.
00035| - There are three user roles: port_admin, terminal_operator, and carrier.
00036| - Bookings follow a lifecycle: pending → confirmed/rejected → consumed/cancelled/expired.
00037| - Trucks are classified by type (container, flatbed, tanker, etc.) and class (light, medium, heavy, super_heavy).
00038| 
00039| Guidelines:
00040| - Always use the available tools to fetch real data. Never make up information.
00041| - When showing bookings, terminals, or slots, present data in a clear structured way.
00042| - If the user asks about policies, use the getSystemConfig tool.
00043| - If the user asks for something you don't have a tool for, let them know politely.
00044| - If a tool returns an ACCESS_DENIED error, explain that the user's role does not allow this action.
00045| - Respond in the same language the user writes in (French or English).
00046| - Be concise but thorough.`,
00047|   tools: ALL_TOOLS,
00048|   maxSteps: 5,
00049| });
00050| 

(End of file - total 50 lines)
</file>
```

---

## User

---

## Assistant (Compaction · claude-opus-4.5 · 48.4s)

# Conversation Summary: APCS Maritime Port Booking System

## Project Overview

We are building **APCS (Advanced Port Container System)** - a centralized platform to regulate maritime port access through a synchronized booking system and terminal capacity engine with a **conversational AI interface** (similar to ChatGPT).

## What Was Done

### 1. Requirements Gathering (Extensive Q&A)

I asked ~40 clarifying questions to define the system. Key decisions made:

| Aspect | Decision |
|--------|----------|
| **Booking Model** | 1 booking = 1 truck + multiple containers (pick-up/drop-off) |
| **Capacity** | Terminal-level (truck count), NOT gate-level |
| **Gate Assignment** | At approval time, not booking time |
| **Auto-Validation** | First N% of slot capacity auto-approved (N configurable by admin) |
| **Container Properties** | Type (dry/reefer/open_top/flat_rack/tank/hazardous), dimensions (20ft/40ft/40ft_hc/45ft), weight class |
| **Carrier Model** | NO carrier companies - trucks belong directly to carrier users |
| **Language** | French only (UI + AI responses) |
| **QR Code** | Reference ID only (server lookup required), double scan (entry + exit) |
| **Analytics** | Comprehensive with Convex aggregate component, export CSV/PDF |
| **Audit Logging** | Full trail (mutations + queries + AI tool calls + failed attempts) |
| **Mobile App** | Excluded for now (web only) |
| **Booking Modifications** | Can only change truck; other changes require cancel + rebook |
| **Cancellation** | Allowed anytime |
| **No-shows** | Grace period then auto-expire |

### 2. Created High-Level Implementation Plan

A plan file was created at:
```
/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md
```

This covers 11 phases over ~9-12 weeks.

### 3. Loaded Convex Skills

The following skills were loaded for best practices:
- `convex-best-practices`
- `convex-functions`
- `convex-schema-validator`
- `convex-agents`
- `convex-file-storage`
- `convex-cron-jobs`
- `convex-http-actions`

### 4. Current State Assessment

**Existing codebase structure:**
- Monorepo: `apps/web` (TanStack Start + Vite), `packages/backend` (Convex)
- Schema exists at `packages/backend/convex/schema.ts` with:
  - `terminals`, `gates`, `timeSlots`, `bookings`, `bookingHistory`
  - `carrierCompanies`, `carrierUsers` (TO BE REMOVED)
  - `trucks`, `notifications`, `userProfiles`, `systemConfig`
- AI agent exists at `packages/backend/convex/ai/agent.ts` using `@convex-dev/agent` + Google Gemini
- Better Auth configured with roles: `port_admin`, `terminal_operator`, `carrier`
- 48+ AI element components in `apps/web/src/components/ai-elements/`

## What Needs To Be Done Next

The user requested an **exhaustive backend implementation plan** with full implementation details. This means creating a detailed plan that covers:

### Schema Changes Required
1. **Remove** `carrierCompanies` and `carrierUsers` tables
2. **Add** `containers` table with: containerNumber, type, dimensions, weightClass, operationType, readyDate/departureDate, isEmpty, bookingId, ownerId
3. **Refactor** `trucks` table: remove `carrierCompanyId`, add `ownerId` (carrier user ID)
4. **Refactor** `bookings` table: add `containerIds[]`, `wasAutoValidated`, `entryScannedAt/exitScannedAt`, change to terminal-level (remove gate requirement at creation)
5. **Refactor** `timeSlots` table: change from gate-level to terminal-level capacity
6. **Add** `auditLogs` table for full audit trail
7. **Add** `bookingAggregates` table for analytics
8. **Update** `terminals` table: add `autoValidationThreshold`, `capacityAlertThresholds[]`
9. **Update** `systemConfig` table: add `defaultAutoValidationThreshold`, `noShowGracePeriodMinutes`, booking window settings

### Backend Functions Required
- Container CRUD (queries/mutations)
- Refactored booking mutations with auto-validation logic
- Gate assignment at approval time
- QR code generation and scanning
- Notification service with email (Resend)
- Capacity alert system
- Analytics aggregation jobs
- Audit logging utilities
- Seed data generation (~750 containers)

### AI Tools Required
- French-only agent instructions
- `listMyContainers`, `selectContainersForBooking`
- `suggestOptimalSlots` (load balancing + urgency optimization)
- `getSlotAvailability`
- `createBookingViaAI`, `cancelBookingViaAI`, `changeTruckViaAI`
- `listMyTrucks`

## Files To Modify/Create

### Critical Backend Files
```
packages/backend/convex/
├── schema.ts                          # MAJOR REFACTOR
├── lib/
│   ├── validators.ts                  # ADD container validators
│   ├── permissions.ts                 # MODIFY (remove carrier company logic)
│   ├── capacity.ts                    # MAJOR REFACTOR (terminal-level)
│   ├── autoValidation.ts              # CREATE
│   ├── auditLog.ts                    # CREATE
│   └── withAudit.ts                   # CREATE
├── containers/
│   ├── queries.ts                     # CREATE
│   └── mutations.ts                   # CREATE
├── bookings/
│   ├── queries.ts                     # MODIFY
│   ├── mutations.ts                   # MAJOR REFACTOR
│   └── internal.ts                    # CREATE (gate assignment)
├── trucks/
│   ├── queries.ts                     # MODIFY
│   └── mutations.ts                   # MODIFY
├── timeSlots/
│   └── mutations.ts                   # ADD bulk operations
├── ai/
│   ├── agent.ts                       # MODIFY (French instructions)
│   ├── registry.ts                    # MODIFY
│   ├── tools/
│   │   ├── containers.ts              # CREATE
│   │   ├── slots.ts                   # CREATE
│   │   ├── booking-flow.ts            # CREATE
│   │   ├── trucks.ts                  # CREATE
│   │   └── types.ts                   # MODIFY
│   ├── mutations.ts                   # CREATE
│   └── internalQueries.ts             # MODIFY
├── qr/
│   ├── index.ts                       # CREATE
│   └── scan.ts                        # CREATE
├── notifications/
│   └── service.ts                     # CREATE
├── email/
│   └── index.ts                       # CREATE
├── analytics/
│   ├── compute.ts                     # CREATE
│   ├── queries.ts                     # CREATE
│   └── export.ts                      # CREATE
├── audit/
│   ├── queries.ts                     # CREATE
│   └── mutations.ts                   # CREATE
├── seed/
│   └── index.ts                       # CREATE
├── crons.ts                           # MODIFY
├── scheduled.ts                       # MODIFY
└── http.ts                            # MODIFY (if needed for webhooks)
```

## Prompt for Continuing

```
Continue the APCS Maritime Port Booking System backend implementation.

CONTEXT:
- We completed requirements gathering and created a high-level plan
- Now need exhaustive backend implementation with full code details
- Existing schema at packages/backend/convex/schema.ts needs major refactoring
- Key change: Remove carrier companies, trucks belong to carrier users directly
- Containers table must be added (seeded, pre-assigned to carriers)
- Bookings must support multiple containers per booking
- Capacity is terminal-level (not gate), measured in truck count
- Auto-validation: first N% of slot capacity auto-approved
- Gate assigned at approval time, not booking creation
- French-only AI assistant
- Full audit logging required

LOADED SKILLS: convex-best-practices, convex-functions, convex-schema-validator, convex-agents, convex-file-storage, convex-cron-jobs, convex-http-actions

PLAN FILE: /home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md

TASK: Create an exhaustive backend implementation plan with:
1. Complete schema.ts with all tables, validators, and indexes
2. All query and mutation functions with full implementation
3. AI tools with proper French descriptions
4. Cron jobs for expiration, reminders, analytics
5. QR code generation and scanning logic
6. Notification service with email templates
7. Audit logging system
8. Seed data generation script

Start by reading the existing schema.ts and the plan file, then provide the complete implementation details for each phase.
```

---

## User

Write the full backend plan.

---

## Assistant (Plan · claude-opus-4.5 · 111.5s)

_Thinking:_

The user wants me to write the full backend plan for the APCS Maritime Port Booking System. I need to:

1. First, read the existing plan file and schema to understand the current state
2. Then create a comprehensive backend implementation plan

Let me start by reading the existing files to understand what we have.

I'll read the existing plan file and the current schema to create a comprehensive backend implementation plan.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md"
}
```

**Output:**
```
<file>
00001| # APCS Maritime Port Booking System - Implementation Plan
00002| 
00003| ## Overview
00004| 
00005| This plan covers the development of a centralized platform to regulate maritime port access through a synchronized booking system and terminal capacity engine with a conversational AI interface.
00006| 
00007| ### Key Requirements Summary
00008| 
00009| | Aspect | Specification |
00010| |--------|---------------|
00011| | **User Roles** | Port Admin, Terminal Operator, Carrier |
00012| | **Interface** | Conversational AI (chat-centric) + Traditional dashboards in sidebar |
00013| | **Booking Model** | 1 booking = 1 truck + multiple containers (pick-up/drop-off) |
00014| | **Capacity** | Terminal-level (truck count), not gate-level |
00015| | **Auto-Validation** | First N% of slot capacity auto-approved (N configurable) |
00016| | **Language** | French only (UI + AI responses) |
00017| | **QR Code** | Reference ID only (server lookup required), double scan (entry + exit) |
00018| | **Analytics** | Comprehensive with Convex aggregate component, export to CSV/PDF |
00019| | **Audit Logging** | Full trail (mutations + queries + AI tool calls + failed attempts) |
00020| 
00021| ---
00022| 
00023| ## Phase 1: Schema Refactoring (Foundation)
00024| **Duration:** 3-5 days | **Priority:** Critical
00025| 
00026| ### Changes
00027| 
00028| **Remove carrier company concept:**
00029| - Delete `carrierCompanies` and `carrierUsers` tables
00030| - Trucks belong directly to carrier users via `ownerId`
00031| 
00032| **Add containers table:**
00033| ```
00034| containers: {
00035|   ownerId, containerNumber, type (dry/reefer/open_top/flat_rack/tank/hazardous),
00036|   dimensions (20ft/40ft/40ft_hc/45ft), weightClass, operationType (pick_up/drop_off),
00037|   readyDate, departureDate, isEmpty, bookingId, isActive
00038| }
00039| ```
00040| 
00041| **Refactor bookings table:**
00042| ```
00043| bookings: {
00044|   terminalId, carrierId, truckId, gateId (assigned at approval),
00045|   bookingReference (TER1-BK-001234), status, wasAutoValidated,
00046|   containerIds[], preferredDate/Time, entryScannedAt, exitScannedAt,
00047|   qrCode, qrCodeStorageId, driverInfo
00048| }
00049| ```
00050| 
00051| **Update time slots:** Terminal-level capacity (not gate), add `autoValidationThreshold`
00052| 
00053| **Add audit logs table:** Full audit trail with userId, action, resource, args, result, IP/device info
00054| 
00055| ### Files to Modify/Create
00056| 
00057| | File | Action |
00058| |------|--------|
00059| | `packages/backend/convex/schema.ts` | Major refactor |
00060| | `packages/backend/convex/lib/validators.ts` | Add new validators |
00061| | `packages/backend/convex/containers/queries.ts` | Create |
00062| | `packages/backend/convex/containers/mutations.ts` | Create |
00063| | `packages/backend/convex/audit/queries.ts` | Create |
00064| | `packages/backend/convex/audit/mutations.ts` | Create |
00065| 
00066| ---
00067| 
00068| ## Phase 2: Core Backend Functions
00069| **Duration:** 5-7 days | **Dependencies:** Phase 1
00070| 
00071| ### Key Changes
00072| 
00073| - **Permissions:** Remove carrier company logic, update `canManageTruck` for direct ownership
00074| - **Capacity Engine:** Terminal-level capacity with `getTerminalSlotCapacity()`, `shouldAutoValidate()`
00075| - **Booking Mutations:**
00076|   - Container validation (ownership, availability)
00077|   - Auto-validation logic on create
00078|   - Terminal-prefixed reference generation (`TER1-BK-XXXXXX`)
00079|   - Gate assignment at approval time (load-balanced across compatible gates)
00080| 
00081| ### Files to Modify
00082| 
00083| | File | Action |
00084| |------|--------|
00085| | `packages/backend/convex/lib/permissions.ts` | Modify |
00086| | `packages/backend/convex/lib/capacity.ts` | Major refactor |
00087| | `packages/backend/convex/bookings/mutations.ts` | Major refactor |
00088| | `packages/backend/convex/bookings/queries.ts` | Modify |
00089| | `packages/backend/convex/bookings/internal.ts` | Create gate assignment logic |
00090| | `packages/backend/convex/trucks/mutations.ts` | Remove carrier company refs |
00091| 
00092| ---
00093| 
00094| ## Phase 3: AI Tools and Conversational Flows
00095| **Duration:** 7-10 days | **Dependencies:** Phase 1, 2
00096| 
00097| ### Agent Configuration
00098| 
00099| - French-only responses
00100| - System prompt for booking flow guidance
00101| - `maxSteps: 10` for complex conversations
00102| 
00103| ### New AI Tools
00104| 
00105| | Tool | Role | Purpose |
00106| |------|------|---------|
00107| | `listMyContainers` | carrier | List carrier's containers with filters |
00108| | `selectContainersForBooking` | carrier | Interactive container selection widget |
00109| | `suggestOptimalSlots` | carrier | Slot recommendations (load balancing + urgency) |
00110| | `getSlotAvailability` | carrier/operator | Calendar view of slot availability |
00111| | `createBookingViaAI` | carrier | Create booking mutation |
00112| | `cancelBookingViaAI` | carrier | Cancel booking mutation |
00113| | `changeTruckViaAI` | carrier | Change truck assignment |
00114| | `listMyTrucks` | carrier | List carrier's trucks |
00115| 
00116| ### Chat Widget Components
00117| 
00118| Create in `apps/web/src/components/ai-elements/apcs/`:
00119| - `container-list.tsx` - Display containers
00120| - `container-selector.tsx` - Interactive selection
00121| - `slot-suggestions.tsx` - Optimal slot recommendations
00122| - `slot-calendar.tsx` - Availability calendar
00123| - `booking-confirmation-card.tsx` - Booking result with status
00124| - `truck-selector.tsx` - Truck selection
00125| - `booking-summary.tsx` - Expandable booking details
00126| 
00127| ### Files to Create/Modify
00128| 
00129| | File | Action |
00130| |------|--------|
00131| | `packages/backend/convex/ai/agent.ts` | Update (French instructions) |
00132| | `packages/backend/convex/ai/tools/containers.ts` | Create |
00133| | `packages/backend/convex/ai/tools/slots.ts` | Create |
00134| | `packages/backend/convex/ai/tools/booking-flow.ts` | Create |
00135| | `packages/backend/convex/ai/tools/trucks.ts` | Create |
00136| | `packages/backend/convex/ai/registry.ts` | Update |
00137| | `packages/backend/convex/ai/tools/types.ts` | Update permissions |
00138| | `apps/web/src/components/ai-elements/apcs/*.tsx` | Create 7 files |
00139| 
00140| ---
00141| 
00142| ## Phase 4: Time Slot Bulk Editing
00143| **Duration:** 4-5 days | **Dependencies:** Phase 1, 2
00144| 
00145| ### Bulk Operations
00146| 
00147| 1. **Same day, multiple slots:** Bulk update capacity for all morning/afternoon slots
00148| 2. **Copy day template:** Apply one day's configuration to other days
00149| 3. **Weekly recurring patterns:** Define patterns that apply to specific days of week
00150| 
00151| ### Mutations
00152| 
00153| - `copyDayTemplate(terminalId, sourceDate, targetDates[], skipExisting)`
00154| - `createWeeklyPattern(terminalId, startDate, endDate, daysOfWeek[], slots[], skipExisting)`
00155| - `bulkUpdateCapacity(terminalId, date, slotIds?, maxCapacity, autoValidationThreshold?)`
00156| - `bulkToggleActive(terminalId, date, slotIds, isActive)`
00157| 
00158| ### Files to Create
00159| 
00160| | File | Action |
00161| |------|--------|
00162| | `packages/backend/convex/timeSlots/mutations.ts` | Major update |
00163| | `apps/web/src/features/time-slots/components/slot-editor.tsx` | Create |
00164| | `apps/web/src/features/time-slots/components/bulk-slot-editor.tsx` | Create |
00165| | `apps/web/src/features/time-slots/components/day-template-picker.tsx` | Create |
00166| | `apps/web/src/features/time-slots/components/weekly-pattern-wizard.tsx` | Create |
00167| | `apps/web/src/routes/operator/slots.tsx` | Create |
00168| 
00169| ---
00170| 
00171| ## Phase 5: Auto-Validation and Approval Workflows
00172| **Duration:** 3-4 days | **Dependencies:** Phase 1, 2, 4
00173| 
00174| ### Auto-Validation Engine
00175| 
00176| - Check confirmed auto-validated count vs threshold limit
00177| - Threshold = `(maxCapacity × autoValidationThreshold) / 100`
00178| - First N% auto-approved, rest queued for manual review
00179| 
00180| ### Manual Approval Workflow
00181| 
00182| - `confirmBooking(bookingId, gateId?, note?)` - Assigns gate, generates QR, sends notification
00183| - `rejectBooking(bookingId, reason)` - Records rejection, sends notification
00184| - Approval queue UI with FIFO ordering (priority algorithm later)
00185| 
00186| ### Files to Create
00187| 
00188| | File | Action |
00189| |------|--------|
00190| | `packages/backend/convex/lib/autoValidation.ts` | Create |
00191| | `packages/backend/convex/bookings/mutations.ts` | Update confirm/reject |
00192| | `apps/web/src/features/approvals/components/approval-queue.tsx` | Create |
00193| | `apps/web/src/features/approvals/components/approval-card.tsx` | Create |
00194| | `apps/web/src/features/approvals/components/bulk-approval.tsx` | Create |
00195| | `apps/web/src/routes/operator/approvals.tsx` | Create |
00196| 
00197| ---
00198| 
00199| ## Phase 6: Notification System with Email
00200| **Duration:** 4-5 days | **Dependencies:** Phase 1, 5
00201| 
00202| ### Notification Triggers
00203| 
00204| | Event | Recipients |
00205| |-------|------------|
00206| | Booking created | Carrier |
00207| | Booking confirmed | Carrier |
00208| | Booking rejected | Carrier |
00209| | Booking cancelled | Carrier |
00210| | Slot reminder | Carrier |
00211| | Capacity alert | Terminal operators |
00212| 
00213| ### Email Integration
00214| 
00215| - Use Resend for email delivery
00216| - French templates for all notification types
00217| - User preference for channel (in-app, email, or both)
00218| 
00219| ### Capacity Alert System
00220| 
00221| - Configurable thresholds per terminal (e.g., [70, 85, 95])
00222| - Cron job checks capacity utilization daily
00223| - Alerts sent to assigned terminal operators
00224| 
00225| ### Files to Create
00226| 
00227| | File | Action |
00228| |------|--------|
00229| | `packages/backend/convex/notifications/service.ts` | Create |
00230| | `packages/backend/convex/email/index.ts` | Create |
00231| | `packages/backend/convex/scheduled.ts` | Update (capacity alerts) |
00232| | `packages/backend/convex/crons.ts` | Update |
00233| 
00234| ---
00235| 
00236| ## Phase 7: QR Code Generation and Scanning
00237| **Duration:** 3-4 days | **Dependencies:** Phase 5
00238| 
00239| ### QR Code Generation
00240| 
00241| - Contains only booking reference + type identifier
00242| - Generated on booking approval (auto or manual)
00243| - Stored in Convex file storage + data URL for immediate display
00244| 
00245| ### Double Scan System
00246| 
00247| - Entry scan: Updates status to "consumed", records timestamp
00248| - Exit scan: Records exit timestamp
00249| - Both scans require terminal operator role
00250| 
00251| ### Scan Validation
00252| 
00253| - Verify booking reference exists
00254| - Verify gate belongs to correct terminal
00255| - Verify booking status allows the scan type
00256| - Verify user has terminal access
00257| 
00258| ### Files to Create
00259| 
00260| | File | Action |
00261| |------|--------|
00262| | `packages/backend/convex/qr/index.ts` | Create |
00263| | `packages/backend/convex/qr/scan.ts` | Create |
00264| | `apps/web/src/features/scanner/components/qr-scanner.tsx` | Create |
00265| | `apps/web/src/features/scanner/components/scan-result.tsx` | Create |
00266| | `apps/web/src/routes/operator/scanner.tsx` | Create |
00267| 
00268| ---
00269| 
00270| ## Phase 8: Dashboard UI Components
00271| **Duration:** 5-7 days | **Dependencies:** Phase 1-7
00272| 
00273| ### Layout
00274| 
00275| - Main navigation sidebar (left)
00276| - Content area (center)
00277| - Closeable chat sidebar (right) - accessible from all dashboard pages
00278| 
00279| ### Role-Specific Dashboards
00280| 
00281| | Role | Dashboard Features |
00282| |------|-------------------|
00283| | Port Admin | Global overview, system config, user management, audit logs |
00284| | Terminal Operator | Terminal-specific metrics, approval queue, slot management, scanner |
00285| | Carrier | Personal bookings, truck fleet, container list, booking history |
00286| 
00287| ### Dashboard Components
00288| 
00289| Create in `apps/web/src/features/dashboard/`:
00290| - `stats-card.tsx` - Metric card with trend
00291| - `booking-chart.tsx` - Booking trends
00292| - `capacity-gauge.tsx` - Terminal capacity gauge
00293| - `recent-activity.tsx` - Activity feed
00294| - `pending-actions.tsx` - Actions needing attention
00295| - `terminal-overview.tsx` - Terminal status grid
00296| - `date-range-picker.tsx` - Custom date selection
00297| - `export-button.tsx` - CSV/PDF export
00298| 
00299| ### Files to Create
00300| 
00301| | File | Action |
00302| |------|--------|
00303| | `apps/web/src/layouts/dashboard-layout.tsx` | Create |
00304| | `apps/web/src/components/chat-sidebar.tsx` | Create |
00305| | `apps/web/src/routes/admin/dashboard.tsx` | Create |
00306| | `apps/web/src/routes/operator/dashboard.tsx` | Create |
00307| | `apps/web/src/routes/carrier/dashboard.tsx` | Create |
00308| | `apps/web/src/features/dashboard/components/*.tsx` | Create 8 files |
00309| 
00310| ---
00311| 
00312| ## Phase 9: Analytics with Aggregations
00313| **Duration:** 5-7 days | **Dependencies:** Phase 8
00314| 
00315| ### Aggregation Tables
00316| 
00317| ```
00318| bookingAggregates: {
00319|   terminalId, date, hour?,
00320|   counts (total, pending, confirmed, rejected, consumed, cancelled, expired, autoValidated),
00321|   capacity metrics (avg/peak utilization),
00322|   container metrics (total, pickup, dropoff),
00323|   timing (avgWaitTime, avgProcessingTime),
00324|   computedAt
00325| }
00326| ```
00327| 
00328| ### Aggregation Jobs
00329| 
00330| - Hourly aggregation cron job
00331| - Daily rollup aggregation
00332| - Weekly summary aggregation
00333| 
00334| ### Analytics Features
00335| 
00336| - Custom date range picker with presets
00337| - Hourly/daily/weekly aggregation views
00338| - Terminal-specific vs global metrics
00339| - Export to CSV and PDF
00340| 
00341| ### Files to Create
00342| 
00343| | File | Action |
00344| |------|--------|
00345| | `packages/backend/convex/schema.ts` | Add bookingAggregates |
00346| | `packages/backend/convex/analytics/compute.ts` | Create |
00347| | `packages/backend/convex/analytics/queries.ts` | Create |
00348| | `packages/backend/convex/analytics/export.ts` | Create |
00349| | `packages/backend/convex/crons.ts` | Add hourly aggregation |
00350| | `apps/web/src/features/analytics/components/*.tsx` | Create chart components |
00351| 
00352| ---
00353| 
00354| ## Phase 10: Audit Logging System
00355| **Duration:** 3-4 days | **Dependencies:** Phase 1
00356| 
00357| ### Audit Entry Structure
00358| 
00359| ```
00360| auditLogs: {
00361|   userId?, action, resource, resourceId?, args (sanitized), result,
00362|   ipAddress?, userAgent?, sessionId?, aiThreadId?, aiToolName?,
00363|   timestamp, durationMs?
00364| }
00365| ```
00366| 
00367| ### Audit Actions
00368| 
00369| - `query`, `mutation`, `ai_tool_call`, `login`, `logout`, `failed_auth`, `permission_denied`
00370| 
00371| ### Implementation
00372| 
00373| - `logAudit()` utility function with arg sanitization
00374| - `withAudit()` wrapper for mutations
00375| - Admin-only audit log viewer with filters
00376| 
00377| ### Files to Create
00378| 
00379| | File | Action |
00380| |------|--------|
00381| | `packages/backend/convex/lib/auditLog.ts` | Create |
00382| | `packages/backend/convex/lib/withAudit.ts` | Create |
00383| | `packages/backend/convex/audit/queries.ts` | Create |
00384| | `apps/web/src/routes/admin/audit-logs.tsx` | Create |
00385| 
00386| ---
00387| 
00388| ## Phase 11: Seed Data Generation
00389| **Duration:** 2-3 days | **Dependencies:** All previous phases
00390| 
00391| ### Seed Data Scale
00392| 
00393| | Entity | Count |
00394| |--------|-------|
00395| | Terminals | 4 |
00396| | Gates | 2-4 per terminal |
00397| | Time Slots | 30 days × 24 hours |
00398| | Carriers | 25 |
00399| | Trucks | 2-5 per carrier (~75 total) |
00400| | Containers | 750 |
00401| | Terminal Operators | 8 |
00402| | Bookings | Realistic distribution |
00403| 
00404| ### Container Generation
00405| 
00406| - ISO 6346 format container numbers
00407| - Realistic distribution of types, dimensions, weight classes
00408| - 70% drop-off, 30% pick-up operations
00409| - 30% empty containers
00410| 
00411| ### Files to Create
00412| 
00413| | File | Action |
00414| |------|--------|
00415| | `packages/backend/convex/seed/index.ts` | Create |
00416| | `packages/backend/convex/seed/terminals.ts` | Create |
00417| | `packages/backend/convex/seed/containers.ts` | Create |
00418| | `packages/backend/convex/seed/bookings.ts` | Create |
00419| | `packages/backend/convex/seed/users.ts` | Create |
00420| 
00421| ---
00422| 
00423| ## Timeline Summary
00424| 
00425| | Phase | Duration | Cumulative |
00426| |-------|----------|------------|
00427| | 1. Schema Refactoring | 3-5 days | Week 1 |
00428| | 2. Core Backend | 5-7 days | Week 2 |
00429| | 3. AI Tools | 7-10 days | Week 3-4 |
00430| | 4. Time Slot Bulk Editing | 4-5 days | Week 5 |
00431| | 5. Auto-Validation | 3-4 days | Week 5-6 |
00432| | 6. Notifications | 4-5 days | Week 6-7 |
00433| | 7. QR Codes | 3-4 days | Week 7 |
00434| | 8. Dashboard UI | 5-7 days | Week 8-9 |
00435| | 9. Analytics | 5-7 days | Week 9-10 |
00436| | 10. Audit Logging | 3-4 days | Week 10-11 |
00437| | 11. Seed Data | 2-3 days | Week 11 |
00438| 
00439| **Total Estimated Duration:** 45-61 days (9-12 weeks)
00440| 
00441| ---
00442| 
00443| ## Verification Strategy
00444| 
00445| ### Unit Tests
00446| - Validators and utility functions
00447| - Capacity calculations
00448| - Auto-validation logic
00449| 
00450| ### Integration Tests
00451| - Booking creation flow (with auto-validation)
00452| - Approval workflow
00453| - QR scan sequences
00454| 
00455| ### E2E Tests (Playwright)
00456| 1. Carrier booking flow via AI chat
00457| 2. Terminal operator approval workflow
00458| 3. QR scan entry/exit sequence
00459| 4. Admin configuration changes
00460| 
00461| ### Performance Tests
00462| - Concurrent booking creation
00463| - Capacity engine under load
00464| - Analytics queries with large datasets
00465| 
00466| ---
00467| 
00468| ## Critical Files Reference
00469| 
00470| ### Backend Core
00471| - `packages/backend/convex/schema.ts`
00472| - `packages/backend/convex/lib/permissions.ts`
00473| - `packages/backend/convex/lib/capacity.ts`
00474| - `packages/backend/convex/bookings/mutations.ts`
00475| - `packages/backend/convex/ai/agent.ts`
00476| - `packages/backend/convex/ai/registry.ts`
00477| 
00478| ### Frontend Core
00479| - `apps/web/src/layouts/dashboard-layout.tsx`
00480| - `apps/web/src/components/chat-sidebar.tsx`
00481| - `apps/web/src/components/ai-elements/apcs/*.tsx`
00482| - `apps/web/src/features/*/components/*.tsx`
00483| 

(End of file - total 483 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/schema.ts"
}
```

**Output:**
```
<file>
00001| import { defineSchema, defineTable } from "convex/server";
00002| import { v } from "convex/values";
00003| 
00004| // ============================================================================
00005| // SHARED VALIDATORS (exported for reuse in functions)
00006| // ============================================================================
00007| 
00008| /** APCS user roles */
00009| export const apcsRoleValidator = v.union(
00010|   v.literal("port_admin"),
00011|   v.literal("terminal_operator"),
00012|   v.literal("carrier")
00013| );
00014| 
00015| /** Booking status lifecycle */
00016| export const bookingStatusValidator = v.union(
00017|   v.literal("pending"),
00018|   v.literal("confirmed"),
00019|   v.literal("rejected"),
00020|   v.literal("consumed"),
00021|   v.literal("cancelled"),
00022|   v.literal("expired")
00023| );
00024| 
00025| /** Truck size/weight class */
00026| export const truckClassValidator = v.union(
00027|   v.literal("light"), // < 3.5t
00028|   v.literal("medium"), // 3.5t - 7.5t
00029|   v.literal("heavy"), // 7.5t - 18t
00030|   v.literal("super_heavy") // > 18t
00031| );
00032| 
00033| /** Truck type */
00034| export const truckTypeValidator = v.union(
00035|   v.literal("container"),
00036|   v.literal("flatbed"),
00037|   v.literal("tanker"),
00038|   v.literal("refrigerated"),
00039|   v.literal("bulk"),
00040|   v.literal("general")
00041| );
00042| 
00043| /** Notification type */
00044| export const notificationTypeValidator = v.union(
00045|   v.literal("booking_created"),
00046|   v.literal("booking_confirmed"),
00047|   v.literal("booking_rejected"),
00048|   v.literal("booking_cancelled"),
00049|   v.literal("booking_modified"),
00050|   v.literal("booking_reminder"),
00051|   v.literal("booking_expired"),
00052|   v.literal("capacity_alert"),
00053|   v.literal("system_announcement")
00054| );
00055| 
00056| /** Notification channel */
00057| export const notificationChannelValidator = v.union(
00058|   v.literal("in_app"),
00059|   v.literal("email"),
00060|   v.literal("both")
00061| );
00062| 
00063| /** Language preference */
00064| export const languageValidator = v.union(v.literal("en"), v.literal("fr"));
00065| 
00066| /** Booking history change types */
00067| export const bookingChangeTypeValidator = v.union(
00068|   v.literal("created"),
00069|   v.literal("status_changed"),
00070|   v.literal("time_slot_changed"),
00071|   v.literal("truck_changed"),
00072|   v.literal("driver_updated"),
00073|   v.literal("details_updated")
00074| );
00075| 
00076| // ============================================================================
00077| // SCHEMA DEFINITION
00078| // ============================================================================
00079| 
00080| export default defineSchema({
00081|   // --------------------------------------------------------------------------
00082|   // TERMINALS & GATES
00083|   // --------------------------------------------------------------------------
00084| 
00085|   /**
00086|    * Terminals - Physical port terminals
00087|    * Created by: port_admin
00088|    */
00089|   terminals: defineTable({
00090|     name: v.string(),
00091|     code: v.string(), // Unique terminal code (e.g., "TRM-001")
00092|     address: v.optional(v.string()),
00093|     timezone: v.string(), // e.g., "America/New_York"
00094|     isActive: v.boolean(),
00095|     createdAt: v.number(),
00096|     updatedAt: v.number(),
00097|     createdBy: v.string(), // Better Auth user ID (stored as string)
00098|   })
00099|     .index("by_code", ["code"])
00100|     .index("by_active", ["isActive"])
00101|     .index("by_created_by", ["createdBy"]),
00102| 
00103|   /**
00104|    * Gates - Entry points at terminals with capacity
00105|    * Created by: port_admin or terminal_operator
00106|    */
00107|   gates: defineTable({
00108|     terminalId: v.id("terminals"),
00109|     name: v.string(),
00110|     code: v.string(), // e.g., "GATE-A1"
00111|     description: v.optional(v.string()),
00112|     isActive: v.boolean(),
00113|     // Default capacity (can be overridden per time slot)
00114|     defaultCapacity: v.number(),
00115|     // Allowed truck types at this gate
00116|     allowedTruckTypes: v.array(truckTypeValidator),
00117|     // Allowed truck classes at this gate
00118|     allowedTruckClasses: v.array(truckClassValidator),
00119|     createdAt: v.number(),
00120|     updatedAt: v.number(),
00121|     createdBy: v.string(), // Better Auth user ID
00122|   })
00123|     .index("by_terminal", ["terminalId"])
00124|     .index("by_terminal_and_active", ["terminalId", "isActive"])
00125|     .index("by_code", ["code"]),
00126| 
00127|   /**
00128|    * TimeSlots - Bookable time windows per gate
00129|    * Non-overlapping within the same gate
00130|    */
00131|   timeSlots: defineTable({
00132|     gateId: v.id("gates"),
00133|     // Date as YYYY-MM-DD string for easy indexing
00134|     date: v.string(),
00135|     startTime: v.string(), // HH:mm format (24h)
00136|     endTime: v.string(), // HH:mm format (24h)
00137|     // Max trucks allowed in this slot (overrides gate default if set)
00138|     maxCapacity: v.number(),
00139|     // Calculated field - updated on booking changes
00140|     currentBookings: v.number(),
00141|     isActive: v.boolean(),
00142|     createdAt: v.number(),
00143|     updatedAt: v.number(),
00144|     createdBy: v.string(), // Better Auth user ID
00145|   })
00146|     .index("by_gate", ["gateId"])
00147|     .index("by_gate_and_date", ["gateId", "date"])
00148|     .index("by_date", ["date"])
00149|     .index("by_gate_and_active", ["gateId", "isActive"]),
00150| 
00151|   // --------------------------------------------------------------------------
00152|   // TERMINAL OPERATOR ASSIGNMENTS (Many-to-Many)
00153|   // --------------------------------------------------------------------------
00154| 
00155|   /**
00156|    * TerminalOperatorAssignments - Links operators to terminals
00157|    * An operator can manage multiple terminals
00158|    */
00159|   terminalOperatorAssignments: defineTable({
00160|     userId: v.string(), // Better Auth user ID (with terminal_operator role)
00161|     terminalId: v.id("terminals"),
00162|     assignedAt: v.number(),
00163|     assignedBy: v.string(), // port_admin who made the assignment
00164|     isActive: v.boolean(),
00165|   })
00166|     .index("by_user", ["userId"])
00167|     .index("by_user_and_active", ["userId", "isActive"])
00168|     .index("by_terminal", ["terminalId"])
00169|     .index("by_terminal_and_active", ["terminalId", "isActive"])
00170|     .index("by_user_and_terminal", ["userId", "terminalId"]),
00171| 
00172|   // --------------------------------------------------------------------------
00173|   // CARRIER COMPANIES & TRUCKS
00174|   // --------------------------------------------------------------------------
00175| 
00176|   /**
00177|    * CarrierCompanies - Organizations that own trucks
00178|    * Created by: port_admin or self-registered
00179|    */
00180|   carrierCompanies: defineTable({
00181|     name: v.string(),
00182|     code: v.string(), // Unique company code
00183|     taxId: v.optional(v.string()), // Business registration number
00184|     address: v.optional(v.string()),
00185|     phone: v.optional(v.string()),
00186|     email: v.optional(v.string()),
00187|     isActive: v.boolean(),
00188|     // Notification preferences
00189|     preferredLanguage: languageValidator,
00190|     notificationChannel: notificationChannelValidator,
00191|     createdAt: v.number(),
00192|     updatedAt: v.number(),
00193|     createdBy: v.string(), // Better Auth user ID
00194|   })
00195|     .index("by_code", ["code"])
00196|     .index("by_active", ["isActive"])
00197|     .index("by_name", ["name"]),
00198| 
00199|   /**
00200|    * CarrierUsers - Links Better Auth users to carrier companies
00201|    * A user with 'carrier' role belongs to exactly one company
00202|    */
00203|   carrierUsers: defineTable({
00204|     userId: v.string(), // Better Auth user ID
00205|     carrierCompanyId: v.id("carrierCompanies"),
00206|     isCompanyAdmin: v.boolean(), // Can manage company's trucks/bookings
00207|     joinedAt: v.number(),
00208|     invitedBy: v.optional(v.string()), // Optional for self-registered founders
00209|     isActive: v.boolean(),
00210|   })
00211|     .index("by_user", ["userId"])
00212|     .index("by_company", ["carrierCompanyId"])
00213|     .index("by_company_and_active", ["carrierCompanyId", "isActive"]),
00214| 
00215|   /**
00216|    * Trucks - Vehicles owned by carrier companies
00217|    */
00218|   trucks: defineTable({
00219|     carrierCompanyId: v.id("carrierCompanies"),
00220|     licensePlate: v.string(),
00221|     // Truck classification
00222|     truckType: truckTypeValidator,
00223|     truckClass: truckClassValidator,
00224|     // Additional info
00225|     make: v.optional(v.string()),
00226|     model: v.optional(v.string()),
00227|     year: v.optional(v.number()),
00228|     // Capacity in tons
00229|     maxWeight: v.optional(v.number()),
00230|     isActive: v.boolean(),
00231|     createdAt: v.number(),
00232|     updatedAt: v.number(),
00233|     createdBy: v.string(), // Better Auth user ID
00234|   })
00235|     .index("by_carrier", ["carrierCompanyId"])
00236|     .index("by_carrier_and_active", ["carrierCompanyId", "isActive"])
00237|     .index("by_license_plate", ["licensePlate"])
00238|     .index("by_type", ["truckType"])
00239|     .index("by_class", ["truckClass"]),
00240| 
00241|   // --------------------------------------------------------------------------
00242|   // BOOKINGS
00243|   // --------------------------------------------------------------------------
00244| 
00245|   /**
00246|    * Bookings - Truck time slot reservations
00247|    * Full lifecycle: pending -> confirmed/rejected -> consumed/cancelled/expired
00248|    */
00249|   bookings: defineTable({
00250|     // References
00251|     timeSlotId: v.id("timeSlots"),
00252|     truckId: v.id("trucks"),
00253|     carrierCompanyId: v.id("carrierCompanies"),
00254|     // Denormalized for efficient queries
00255|     gateId: v.id("gates"),
00256|     terminalId: v.id("terminals"),
00257|     // Booking details
00258|     bookingReference: v.string(), // Human-readable reference (e.g., "BK-20240115-001")
00259|     status: bookingStatusValidator,
00260|     // QR code data (stored as data URL or external URL)
00261|     qrCode: v.optional(v.string()),
00262|     // Driver info (optional, can be added later)
00263|     driverName: v.optional(v.string()),
00264|     driverPhone: v.optional(v.string()),
00265|     driverIdNumber: v.optional(v.string()),
00266|     // Container/cargo info
00267|     containerNumber: v.optional(v.string()),
00268|     cargoDescription: v.optional(v.string()),
00269|     // Timestamps
00270|     bookedAt: v.number(),
00271|     confirmedAt: v.optional(v.number()),
00272|     rejectedAt: v.optional(v.number()),
00273|     cancelledAt: v.optional(v.number()),
00274|     consumedAt: v.optional(v.number()),
00275|     // Rejection/cancellation reason
00276|     statusReason: v.optional(v.string()),
00277|     // Who processed this booking (operator who confirmed/rejected)
00278|     processedBy: v.optional(v.string()), // Better Auth user ID
00279|     // Booking creator
00280|     createdBy: v.string(), // Better Auth user ID
00281|     updatedAt: v.number(),
00282|   })
00283|     .index("by_reference", ["bookingReference"])
00284|     .index("by_time_slot", ["timeSlotId"])
00285|     .index("by_time_slot_and_status", ["timeSlotId", "status"])
00286|     .index("by_truck", ["truckId"])
00287|     .index("by_carrier", ["carrierCompanyId"])
00288|     .index("by_carrier_and_status", ["carrierCompanyId", "status"])
00289|     .index("by_terminal", ["terminalId"])
00290|     .index("by_terminal_and_status", ["terminalId", "status"])
00291|     .index("by_gate", ["gateId"])
00292|     .index("by_gate_and_status", ["gateId", "status"])
00293|     .index("by_status", ["status"])
00294|     .index("by_created_by", ["createdBy"]),
00295| 
00296|   /**
00297|    * BookingHistory - Audit trail for all booking changes
00298|    * Immutable log of all modifications
00299|    */
00300|   bookingHistory: defineTable({
00301|     bookingId: v.id("bookings"),
00302|     // What changed
00303|     changeType: bookingChangeTypeValidator,
00304|     // Previous and new values (JSON strings for flexibility)
00305|     previousValue: v.optional(v.string()),
00306|     newValue: v.string(),
00307|     // Change metadata
00308|     changedAt: v.number(),
00309|     changedBy: v.string(), // Better Auth user ID
00310|     // Optional note explaining the change
00311|     note: v.optional(v.string()),
00312|     // For capacity-affecting changes, track if rebook was required
00313|     requiredRebook: v.boolean(),
00314|   })
00315|     .index("by_booking", ["bookingId"])
00316|     .index("by_booking_and_type", ["bookingId", "changeType"])
00317|     .index("by_changed_by", ["changedBy"])
00318|     .index("by_changed_at", ["changedAt"]),
00319| 
00320|   // --------------------------------------------------------------------------
00321|   // NOTIFICATIONS
00322|   // --------------------------------------------------------------------------
00323| 
00324|   /**
00325|    * Notifications - In-app and email notifications
00326|    * Bilingual support (EN/FR)
00327|    */
00328|   notifications: defineTable({
00329|     // Recipient
00330|     userId: v.string(), // Better Auth user ID
00331|     // Notification type and content
00332|     type: notificationTypeValidator,
00333|     channel: notificationChannelValidator,
00334|     // Content (bilingual)
00335|     titleEn: v.string(),
00336|     titleFr: v.string(),
00337|     bodyEn: v.string(),
00338|     bodyFr: v.string(),
00339|     // Related entity (for deep linking)
00340|     relatedEntityType: v.optional(
00341|       v.union(
00342|         v.literal("booking"),
00343|         v.literal("terminal"),
00344|         v.literal("time_slot")
00345|       )
00346|     ),
00347|     relatedEntityId: v.optional(v.string()),
00348|     // Status
00349|     isRead: v.boolean(),
00350|     readAt: v.optional(v.number()),
00351|     // Email status (if channel includes email)
00352|     emailSent: v.optional(v.boolean()),
00353|     emailSentAt: v.optional(v.number()),
00354|     emailError: v.optional(v.string()),
00355|     // Timestamps
00356|     createdAt: v.number(),
00357|   })
00358|     .index("by_user", ["userId"])
00359|     .index("by_user_and_read", ["userId", "isRead"])
00360|     .index("by_user_and_type", ["userId", "type"])
00361|     .index("by_created_at", ["createdAt"]),
00362| 
00363|   // --------------------------------------------------------------------------
00364|   // SYSTEM CONFIGURATION
00365|   // --------------------------------------------------------------------------
00366| 
00367|   /**
00368|    * SystemConfig - Global system settings
00369|    * Singleton table (should have only one document)
00370|    */
00371|   systemConfig: defineTable({
00372|     // Cancellation policy (-1 or 0 = disabled)
00373|     cancellationWindowHours: v.number(),
00374|     // Booking settings
00375|     maxAdvanceBookingDays: v.number(), // How far in advance can book
00376|     minAdvanceBookingHours: v.number(), // Minimum hours before slot
00377|     // Reminder settings
00378|     reminderHoursBefore: v.array(v.number()), // e.g., [24, 2] for 24h and 2h reminders
00379|     // Last updated
00380|     updatedAt: v.number(),
00381|     updatedBy: v.string(), // Better Auth user ID
00382|   }),
00383| 
00384|   // --------------------------------------------------------------------------
00385|   // USER PROFILE EXTENSION
00386|   // --------------------------------------------------------------------------
00387| 
00388|   /**
00389|    * UserProfiles - Extended user data beyond Better Auth
00390|    * One-to-one with Better Auth user table
00391|    * Note: apcsRole is now stored in Better Auth user table, not here
00392|    */
00393|   userProfiles: defineTable({
00394|     userId: v.string(), // Better Auth user ID
00395|     // User preferences
00396|     preferredLanguage: languageValidator,
00397|     notificationChannel: notificationChannelValidator,
00398|     // Phone for future SMS notifications
00399|     phone: v.optional(v.string()),
00400|     // Timestamps
00401|     createdAt: v.number(),
00402|     updatedAt: v.number(),
00403|   })
00404|     .index("by_user", ["userId"]),
00405| });
00406| 

(End of file - total 406 lines)
</file>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore backend structure",
  "prompt": "Explore the Convex backend structure for the APCS project. I need to understand:\n\n1. All existing query and mutation files in packages/backend/convex/\n2. The AI agent implementation at packages/backend/convex/ai/\n3. Any existing lib/ utilities (validators, permissions, capacity)\n4. The crons.ts and scheduled.ts files\n5. Any existing notification or email logic\n\nProvide a comprehensive list of all files with their purposes and key exports. Focus on understanding:\n- What already exists that we can build on\n- What patterns are being used\n- What needs to be modified vs created from scratch\n\nBe thorough - list all relevant files with their key functions/exports.",
  "subagent_type": "explore"
}
```

**Output:**
```
# Summary: APCS Backend Exploration for Convex

## What Was Done

I performed a comprehensive exploration of the APCS (Advanced Port Container System) Convex backend structure at `packages/backend/convex/`. The user requested a detailed understanding of the existing codebase to know what can be built upon vs created from scratch.

## Complete File Inventory

### Schema & Core (`packages/backend/convex/`)
- **schema.ts** - Complete database schema with 12 tables: terminals, gates, timeSlots, terminalOperatorAssignments, carrierCompanies, carrierUsers, trucks, bookings, bookingHistory, notifications, systemConfig, userProfiles
- **auth.ts** - Better Auth integration with custom roles (port_admin, terminal_operator, carrier), user triggers that auto-create userProfiles
- **http.ts** - HTTP router for auth routes
- **crons.ts** - 5 scheduled jobs: expire bookings (15min), 24h reminders (1h), 2h reminders (30min), cleanup notifications (daily), cleanup history (weekly), recalculate capacity (daily)
- **scheduled.ts** - Internal mutations for cron jobs: expireOldBookings, sendBookingReminders, cleanupOldNotifications, cleanupOldBookingHistory, recalculateAllCapacity

### Library Utilities (`packages/backend/convex/lib/`)
- **validators.ts** - All domain validators (roles, statuses, truck types/classes, notification types) + composite input validators + status transition logic
- **permissions.ts** - Full RBAC system: getAuthenticatedUser, requireRole, canManageTerminal, canManageCarrier, canViewBooking, canModifyBookingStatus, getManagedTerminalIds
- **capacity.ts** - Atomic capacity management: checkAndReserveCapacity, releaseCapacity, recalculateCapacity, getAvailableCapacity, hasAvailability

### AI Agent (`packages/backend/convex/ai/`)
- **agent.ts** - Gemini 2.0 Flash agent with system instructions for APCS assistant
- **chat.ts** - Actions: createThread, initiateStream (streaming), generateResponse (non-streaming) with role-based context injection
- **queries.ts** - listThreadMessages query for real-time message subscriptions
- **registry.ts** - Tool registry with ALL_TOOLS map and getToolsForRole function
- **internalQueries.ts** - Internal queries for AI tools: listMyBookings, getBookingByReference, listBookingsByTerminal, listBookingsByCarrier, listPendingBookings, listTerminals, getTerminalDetails, getAvailableSlots, getUserRole, getSystemConfig

### AI Tools (`packages/backend/convex/ai/tools/`)
- **types.ts** - TOOL_PERMISSIONS mapping roles to tools, checkToolAccess guard function
- **bookings.ts** - 5 tools: listMyBookings, getBookingDetails, listBookingsByTerminal, listBookingsByCarrier, listPendingBookings
- **terminals.ts** - 3 tools: listTerminals, getTerminalDetails, getAvailableSlots
- **config.ts** - 1 tool: getSystemConfig

### Domain Modules

**Bookings** (`bookings/`):
- queries.ts - get, getByReference, listMyBookings, listByCarrier, listByTerminal, listByGate, listByTimeSlot, listPendingForOperator, countByStatus
- mutations.ts - create, confirm, reject, cancel, markConsumed, updateDriver, updateDetails, changeTruck, changeTimeSlot
- internal.ts - generateBookingReference, generateQRCodePlaceholder, recordHistory, getHistory, validateTruckForGate, getSystemConfig, canCancelBooking

**Terminals** (`terminals/`):
- queries.ts - list, get, getByCode
- mutations.ts - create, update, deactivate, reactivate

**Gates** (`gates/`):
- queries.ts - listByTerminal, get, getByCode, isTruckAllowed
- mutations.ts - create, update, deactivate, reactivate

**Time Slots** (`timeSlots/`):
- queries.ts - listByGateAndDate, listByGate, get, getTerminalCapacityOverview
- mutations.ts - create, bulkCreate, update, remove

**Trucks** (`trucks/`):
- queries.ts - listByCompany, listMyTrucks, get, getByLicensePlate
- mutations.ts - create, update, deactivate, reactivate, transfer

**Carriers** (`carriers/`):
- queries.ts - list, get, getMyCompany, getByCode, listUsers
- mutations.ts - create, selfRegister, update, inviteUser, removeUser, setUserAdmin

**Users** (`users/`):
- queries.ts - getMyProfile, getProfile, listOperators, listByRole
- mutations.ts - updateMyProfile, setRole, assignOperatorToTerminals, removeOperatorFromTerminal

**Notifications** (`notifications/`):
- queries.ts - list, unreadCount, get, listByType
- mutations.ts - markAsRead, markAllAsRead, deleteOldNotifications
- internal.ts - Bilingual templates (EN/FR), createNotification, sendBookingNotification, sendBookingReminders, notifyUsers helper

**Config** (`config/`):
- queries.ts - get, canCancelBooking
- mutations.ts - upsert

## Key Patterns Identified

1. **RBAC Pattern**: All queries/mutations use `getAuthenticatedUser()` → `requireRole()` or specific permission checks
2. **Validator Pattern**: Shared validators in `lib/validators.ts`, re-exported from schema
3. **Internal Functions**: Domain logic uses `internalMutation`/`internalQuery` for reusable operations
4. **Capacity Pattern**: Atomic reservation with optimistic locking via `checkAndReserveCapacity`
5. **Bilingual Notifications**: All notifications have `titleEn/titleFr` and `bodyEn/bodyFr`
6. **AI Tool Access**: Tools check role via `checkToolAccess()` before executing queries
7. **History Tracking**: BookingHistory table with audit trail for all changes

## What Needs to Be Known for Next Steps

The user's original request was to "explore" the backend to understand what exists. The exploration is complete. To continue, the user should specify what they want to build or modify, such as:
- Adding new AI agent tools
- Creating new domain modules
- Adding email sending functionality (noted as TODO in notifications/internal.ts)
- Extending the schema
- Adding new queries/mutations

---

## Prompt for Continuing in New Session

```
I've completed a thorough exploration of the APCS Convex backend at packages/backend/convex/. 

The backend is a fully-featured port logistics system with:
- 12 database tables (schema.ts)
- Better Auth with custom roles (port_admin, terminal_operator, carrier)
- Full RBAC permission system (lib/permissions.ts)
- AI agent with Gemini 2.0 Flash (ai/agent.ts) using 9 read-only tools
- Cron jobs for booking expiration, reminders, cleanup
- Bilingual notifications (EN/FR)
- Complete CRUD for: terminals, gates, timeSlots, trucks, carriers, bookings, users

Key files to reference:
- Schema: packages/backend/convex/schema.ts (406 lines)
- Permissions: packages/backend/convex/lib/permissions.ts (434 lines)
- Validators: packages/backend/convex/lib/validators.ts (202 lines)
- Booking mutations: packages/backend/convex/bookings/mutations.ts (860 lines)
- AI agent: packages/backend/convex/ai/agent.ts, chat.ts, registry.ts
- AI tools: packages/backend/convex/ai/tools/*.ts
- Notifications: packages/backend/convex/notifications/internal.ts (369 lines)

Notable TODOs found:
- Email sending is stubbed in notifications/internal.ts (line 173)
- QR code generation is a placeholder in bookings/internal.ts

What would you like to build or modify next?
```

<task_metadata>
session_id: ses_3cbcd5dc8ffeJj5mzZtUgWsiZR
</task_metadata>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.4s)

Now let me explore some specific files to understand the current implementation details before writing the comprehensive plan.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/lib/capacity.ts"
}
```

**Output:**
```
<file>
00001| /**
00002|  * Capacity Management Utilities
00003|  * Handles atomic capacity reservation and release for time slots
00004|  */
00005| import type { MutationCtx, QueryCtx } from "../_generated/server";
00006| import type { Id } from "../_generated/dataModel";
00007| 
00008| /**
00009|  * Check if a time slot has capacity and atomically reserve if available.
00010|  * This prevents race conditions where two bookings might exceed capacity.
00011|  *
00012|  * @returns true if capacity was reserved, false if slot is full
00013|  */
00014| export async function checkAndReserveCapacity(
00015|   ctx: MutationCtx,
00016|   timeSlotId: Id<"timeSlots">
00017| ): Promise<boolean> {
00018|   const timeSlot = await ctx.db.get(timeSlotId);
00019|   if (!timeSlot) return false;
00020| 
00021|   // Check current capacity
00022|   if (timeSlot.currentBookings >= timeSlot.maxCapacity) {
00023|     return false;
00024|   }
00025| 
00026|   // Atomically increment the counter
00027|   await ctx.db.patch(timeSlotId, {
00028|     currentBookings: timeSlot.currentBookings + 1,
00029|     updatedAt: Date.now(),
00030|   });
00031| 
00032|   return true;
00033| }
00034| 
00035| /**
00036|  * Release a capacity slot (on cancellation/rejection)
00037|  */
00038| export async function releaseCapacity(
00039|   ctx: MutationCtx,
00040|   timeSlotId: Id<"timeSlots">
00041| ): Promise<void> {
00042|   const timeSlot = await ctx.db.get(timeSlotId);
00043|   if (!timeSlot) return;
00044| 
00045|   await ctx.db.patch(timeSlotId, {
00046|     currentBookings: Math.max(0, timeSlot.currentBookings - 1),
00047|     updatedAt: Date.now(),
00048|   });
00049| }
00050| 
00051| /**
00052|  * Recalculate capacity for a time slot (for data consistency checks)
00053|  * Should be used sparingly, mainly for migrations or repairs
00054|  */
00055| export async function recalculateCapacity(
00056|   ctx: MutationCtx,
00057|   timeSlotId: Id<"timeSlots">
00058| ): Promise<number> {
00059|   // Count active bookings (pending, confirmed)
00060|   const bookings = await ctx.db
00061|     .query("bookings")
00062|     .withIndex("by_time_slot", (q) => q.eq("timeSlotId", timeSlotId))
00063|     .collect();
00064| 
00065|   const activeCount = bookings.filter(
00066|     (b) => b.status === "pending" || b.status === "confirmed"
00067|   ).length;
00068| 
00069|   await ctx.db.patch(timeSlotId, {
00070|     currentBookings: activeCount,
00071|     updatedAt: Date.now(),
00072|   });
00073| 
00074|   return activeCount;
00075| }
00076| 
00077| /**
00078|  * Get available capacity for a time slot (for queries)
00079|  */
00080| export async function getAvailableCapacity(
00081|   ctx: QueryCtx,
00082|   timeSlotId: Id<"timeSlots">
00083| ): Promise<{ available: number; total: number; booked: number }> {
00084|   const timeSlot = await ctx.db.get(timeSlotId);
00085|   if (!timeSlot) {
00086|     return { available: 0, total: 0, booked: 0 };
00087|   }
00088| 
00089|   return {
00090|     available: Math.max(0, timeSlot.maxCapacity - timeSlot.currentBookings),
00091|     total: timeSlot.maxCapacity,
00092|     booked: timeSlot.currentBookings,
00093|   };
00094| }
00095| 
00096| /**
00097|  * Check if a time slot has availability without reserving
00098|  */
00099| export async function hasAvailability(
00100|   ctx: QueryCtx,
00101|   timeSlotId: Id<"timeSlots">
00102| ): Promise<boolean> {
00103|   const capacity = await getAvailableCapacity(ctx, timeSlotId);
00104|   return capacity.available > 0;
00105| }
00106| 
00107| /**
00108|  * Get capacity utilization percentage
00109|  */
00110| export async function getUtilizationPercent(
00111|   ctx: QueryCtx,
00112|   timeSlotId: Id<"timeSlots">
00113| ): Promise<number> {
00114|   const capacity = await getAvailableCapacity(ctx, timeSlotId);
00115|   if (capacity.total === 0) return 0;
00116|   return Math.round((capacity.booked / capacity.total) * 100);
00117| }
00118| 

(End of file - total 118 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/bookings/mutations.ts"
}
```

**Output:**
```
<file>
00001| /**
00002|  * Booking Mutations
00003|  * Create, update, and manage booking lifecycle
00004|  */
00005| import { mutation } from "../_generated/server";
00006| import { v, ConvexError } from "convex/values";
00007| import {
00008|   getAuthenticatedUser,
00009|   requireRole,
00010|   isPortAdmin,
00011|   isCarrier,
00012|   canManageTerminal,
00013|   canViewCarrier,
00014|   canModifyBookingStatus,
00015|   requireBookingView,
00016| } from "../lib/permissions";
00017| import {
00018|   bookingInputValidator,
00019|   bookingStatusValidator,
00020|   isValidStatusTransition,
00021|   type BookingStatus,
00022| } from "../lib/validators";
00023| import {
00024|   checkAndReserveCapacity,
00025|   releaseCapacity,
00026| } from "../lib/capacity";
00027| import {
00028|   generateBookingReference,
00029|   generateQRCodePlaceholder,
00030|   validateTruckForGate,
00031|   getSystemConfig,
00032|   canCancelBooking,
00033| } from "./internal";
00034| import { internal } from "../_generated/api";
00035| 
00036| // ============================================================================
00037| // CREATE BOOKING
00038| // ============================================================================
00039| 
00040| /**
00041|  * Create a new booking
00042|  * Carriers create bookings for their own trucks
00043|  */
00044| export const create = mutation({
00045|   args: bookingInputValidator.fields,
00046|   returns: v.id("bookings"),
00047|   handler: async (ctx, args) => {
00048|     const user = await getAuthenticatedUser(ctx);
00049|     requireRole(user, ["carrier"]);
00050| 
00051|     if (!user.carrierCompanyId) {
00052|       throw new ConvexError({
00053|         code: "FORBIDDEN",
00054|         message: "You must be associated with a carrier company to create bookings",
00055|       });
00056|     }
00057| 
00058|     // 1. Validate time slot exists and is active
00059|     const timeSlot = await ctx.db.get(args.timeSlotId);
00060|     if (!timeSlot) {
00061|       throw new ConvexError({
00062|         code: "NOT_FOUND",
00063|         message: "Time slot not found",
00064|       });
00065|     }
00066|     if (!timeSlot.isActive) {
00067|       throw new ConvexError({
00068|         code: "INVALID_STATE",
00069|         message: "Time slot is not available for booking",
00070|       });
00071|     }
00072| 
00073|     // 2. Validate time slot is in the future
00074|     const slotDateTime = new Date(`${timeSlot.date}T${timeSlot.startTime}`);
00075|     const now = new Date();
00076|     if (slotDateTime <= now) {
00077|       throw new ConvexError({
00078|         code: "INVALID_INPUT",
00079|         message: "Cannot book a time slot in the past",
00080|       });
00081|     }
00082| 
00083|     // 3. Check system config for advance booking rules
00084|     const config = await getSystemConfig(ctx);
00085|     const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
00086|     
00087|     if (hoursUntilSlot < config.minAdvanceBookingHours) {
00088|       throw new ConvexError({
00089|         code: "INVALID_INPUT",
00090|         message: `Bookings must be made at least ${config.minAdvanceBookingHours} hours in advance`,
00091|       });
00092|     }
00093| 
00094|     const daysUntilSlot = hoursUntilSlot / 24;
00095|     if (daysUntilSlot > config.maxAdvanceBookingDays) {
00096|       throw new ConvexError({
00097|         code: "INVALID_INPUT",
00098|         message: `Bookings cannot be made more than ${config.maxAdvanceBookingDays} days in advance`,
00099|       });
00100|     }
00101| 
00102|     // 4. Validate truck
00103|     const truck = await ctx.db.get(args.truckId);
00104|     if (!truck) {
00105|       throw new ConvexError({
00106|         code: "NOT_FOUND",
00107|         message: "Truck not found",
00108|       });
00109|     }
00110|     if (!truck.isActive) {
00111|       throw new ConvexError({
00112|         code: "INVALID_STATE",
00113|         message: "Truck is not active",
00114|       });
00115|     }
00116|     if (truck.carrierCompanyId !== user.carrierCompanyId) {
00117|       throw new ConvexError({
00118|         code: "FORBIDDEN",
00119|         message: "You can only book with trucks from your company",
00120|       });
00121|     }
00122| 
00123|     // 5. Get gate and terminal
00124|     const gate = await ctx.db.get(timeSlot.gateId);
00125|     if (!gate || !gate.isActive) {
00126|       throw new ConvexError({
00127|         code: "INVALID_STATE",
00128|         message: "Gate is not available",
00129|       });
00130|     }
00131| 
00132|     const terminal = await ctx.db.get(gate.terminalId);
00133|     if (!terminal || !terminal.isActive) {
00134|       throw new ConvexError({
00135|         code: "INVALID_STATE",
00136|         message: "Terminal is not available",
00137|       });
00138|     }
00139| 
00140|     // 6. Validate truck compatibility with gate
00141|     const compatibility = await validateTruckForGate(ctx, args.truckId, timeSlot.gateId);
00142|     if (!compatibility.valid) {
00143|       throw new ConvexError({
00144|         code: "INVALID_INPUT",
00145|         message: compatibility.reason ?? "Truck is not compatible with this gate",
00146|       });
00147|     }
00148| 
00149|     // 7. Check if truck already has a booking for this time slot
00150|     const existingTruckBooking = await ctx.db
00151|       .query("bookings")
00152|       .withIndex("by_truck", (q) => q.eq("truckId", args.truckId))
00153|       .filter((q) =>
00154|         q.and(
00155|           q.eq(q.field("timeSlotId"), args.timeSlotId),
00156|           q.or(
00157|             q.eq(q.field("status"), "pending"),
00158|             q.eq(q.field("status"), "confirmed")
00159|           )
00160|         )
00161|       )
00162|       .first();
00163| 
00164|     if (existingTruckBooking) {
00165|       throw new ConvexError({
00166|         code: "DUPLICATE",
00167|         message: "This truck already has a booking for this time slot",
00168|       });
00169|     }
00170| 
00171|     // 8. Reserve capacity (atomic)
00172|     const reserved = await checkAndReserveCapacity(ctx, args.timeSlotId);
00173|     if (!reserved) {
00174|       throw new ConvexError({
00175|         code: "CAPACITY_FULL",
00176|         message: "This time slot is fully booked",
00177|       });
00178|     }
00179| 
00180|     // 9. Generate booking reference
00181|     const bookingReference = await generateBookingReference(ctx);
00182| 
00183|     // 10. Create the booking
00184|     const nowTs = Date.now();
00185|     const bookingId = await ctx.db.insert("bookings", {
00186|       timeSlotId: args.timeSlotId,
00187|       truckId: args.truckId,
00188|       carrierCompanyId: user.carrierCompanyId,
00189|       gateId: timeSlot.gateId,
00190|       terminalId: gate.terminalId,
00191|       bookingReference,
00192|       status: "pending",
00193|       qrCode: generateQRCodePlaceholder(bookingReference),
00194|       driverName: args.driverName?.trim(),
00195|       driverPhone: args.driverPhone?.trim(),
00196|       driverIdNumber: args.driverIdNumber?.trim(),
00197|       containerNumber: args.containerNumber?.trim(),
00198|       cargoDescription: args.cargoDescription?.trim(),
00199|       bookedAt: nowTs,
00200|       createdBy: user.userId,
00201|       updatedAt: nowTs,
00202|     });
00203| 
00204|     // 11. Record history
00205|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00206|       bookingId,
00207|       changeType: "created",
00208|       newValue: JSON.stringify({
00209|         timeSlotId: args.timeSlotId,
00210|         truckId: args.truckId,
00211|         status: "pending",
00212|       }),
00213|       changedBy: user.userId,
00214|       requiredRebook: false,
00215|     });
00216| 
00217|     return bookingId;
00218|   },
00219| });
00220| 
00221| // ============================================================================
00222| // STATUS CHANGES
00223| // ============================================================================
00224| 
00225| /**
00226|  * Confirm a pending booking (terminal operator/admin)
00227|  */
00228| export const confirm = mutation({
00229|   args: {
00230|     bookingId: v.id("bookings"),
00231|     note: v.optional(v.string()),
00232|   },
00233|   returns: v.null(),
00234|   handler: async (ctx, args) => {
00235|     const user = await getAuthenticatedUser(ctx);
00236|     requireRole(user, ["port_admin", "terminal_operator"]);
00237| 
00238|     const booking = await ctx.db.get(args.bookingId);
00239|     if (!booking) {
00240|       throw new ConvexError({
00241|         code: "NOT_FOUND",
00242|         message: "Booking not found",
00243|       });
00244|     }
00245| 
00246|     // Check permission for this terminal
00247|     const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "confirmed");
00248|     if (!canModify) {
00249|       throw new ConvexError({
00250|         code: "FORBIDDEN",
00251|         message: "You do not have permission to confirm this booking",
00252|       });
00253|     }
00254| 
00255|     // Validate status transition
00256|     if (!isValidStatusTransition(booking.status, "confirmed")) {
00257|       throw new ConvexError({
00258|         code: "INVALID_STATE",
00259|         message: `Cannot confirm a booking with status "${booking.status}"`,
00260|       });
00261|     }
00262| 
00263|     const now = Date.now();
00264|     await ctx.db.patch(args.bookingId, {
00265|       status: "confirmed",
00266|       confirmedAt: now,
00267|       processedBy: user.userId,
00268|       updatedAt: now,
00269|     });
00270| 
00271|     // Record history
00272|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00273|       bookingId: args.bookingId,
00274|       changeType: "status_changed",
00275|       previousValue: booking.status,
00276|       newValue: "confirmed",
00277|       changedBy: user.userId,
00278|       note: args.note,
00279|       requiredRebook: false,
00280|     });
00281| 
00282|     return null;
00283|   },
00284| });
00285| 
00286| /**
00287|  * Reject a pending booking (terminal operator/admin)
00288|  */
00289| export const reject = mutation({
00290|   args: {
00291|     bookingId: v.id("bookings"),
00292|     reason: v.string(),
00293|   },
00294|   returns: v.null(),
00295|   handler: async (ctx, args) => {
00296|     const user = await getAuthenticatedUser(ctx);
00297|     requireRole(user, ["port_admin", "terminal_operator"]);
00298| 
00299|     const booking = await ctx.db.get(args.bookingId);
00300|     if (!booking) {
00301|       throw new ConvexError({
00302|         code: "NOT_FOUND",
00303|         message: "Booking not found",
00304|       });
00305|     }
00306| 
00307|     const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "rejected");
00308|     if (!canModify) {
00309|       throw new ConvexError({
00310|         code: "FORBIDDEN",
00311|         message: "You do not have permission to reject this booking",
00312|       });
00313|     }
00314| 
00315|     if (!isValidStatusTransition(booking.status, "rejected")) {
00316|       throw new ConvexError({
00317|         code: "INVALID_STATE",
00318|         message: `Cannot reject a booking with status "${booking.status}"`,
00319|       });
00320|     }
00321| 
00322|     // Release capacity
00323|     await releaseCapacity(ctx, booking.timeSlotId);
00324| 
00325|     const now = Date.now();
00326|     await ctx.db.patch(args.bookingId, {
00327|       status: "rejected",
00328|       rejectedAt: now,
00329|       statusReason: args.reason.trim(),
00330|       processedBy: user.userId,
00331|       updatedAt: now,
00332|     });
00333| 
00334|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00335|       bookingId: args.bookingId,
00336|       changeType: "status_changed",
00337|       previousValue: booking.status,
00338|       newValue: "rejected",
00339|       changedBy: user.userId,
00340|       note: args.reason,
00341|       requiredRebook: false,
00342|     });
00343| 
00344|     return null;
00345|   },
00346| });
00347| 
00348| /**
00349|  * Cancel a booking (carrier can cancel their own, operators can cancel any)
00350|  */
00351| export const cancel = mutation({
00352|   args: {
00353|     bookingId: v.id("bookings"),
00354|     reason: v.optional(v.string()),
00355|   },
00356|   returns: v.null(),
00357|   handler: async (ctx, args) => {
00358|     const user = await getAuthenticatedUser(ctx);
00359| 
00360|     const booking = await ctx.db.get(args.bookingId);
00361|     if (!booking) {
00362|       throw new ConvexError({
00363|         code: "NOT_FOUND",
00364|         message: "Booking not found",
00365|       });
00366|     }
00367| 
00368|     // Check permission
00369|     const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "cancelled");
00370|     if (!canModify) {
00371|       throw new ConvexError({
00372|         code: "FORBIDDEN",
00373|         message: "You do not have permission to cancel this booking",
00374|       });
00375|     }
00376| 
00377|     // For carriers, check cancellation policy
00378|     if (isCarrier(user)) {
00379|       const cancelCheck = await canCancelBooking(ctx, args.bookingId);
00380|       if (!cancelCheck.canCancel) {
00381|         throw new ConvexError({
00382|           code: "FORBIDDEN",
00383|           message: cancelCheck.reason ?? "Cannot cancel this booking",
00384|         });
00385|       }
00386|     }
00387| 
00388|     if (!isValidStatusTransition(booking.status, "cancelled")) {
00389|       throw new ConvexError({
00390|         code: "INVALID_STATE",
00391|         message: `Cannot cancel a booking with status "${booking.status}"`,
00392|       });
00393|     }
00394| 
00395|     // Release capacity
00396|     await releaseCapacity(ctx, booking.timeSlotId);
00397| 
00398|     const now = Date.now();
00399|     await ctx.db.patch(args.bookingId, {
00400|       status: "cancelled",
00401|       cancelledAt: now,
00402|       statusReason: args.reason?.trim(),
00403|       processedBy: user.userId,
00404|       updatedAt: now,
00405|     });
00406| 
00407|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00408|       bookingId: args.bookingId,
00409|       changeType: "status_changed",
00410|       previousValue: booking.status,
00411|       newValue: "cancelled",
00412|       changedBy: user.userId,
00413|       note: args.reason,
00414|       requiredRebook: false,
00415|     });
00416| 
00417|     return null;
00418|   },
00419| });
00420| 
00421| /**
00422|  * Mark a booking as consumed (truck arrived and entered)
00423|  */
00424| export const markConsumed = mutation({
00425|   args: {
00426|     bookingId: v.id("bookings"),
00427|     note: v.optional(v.string()),
00428|   },
00429|   returns: v.null(),
00430|   handler: async (ctx, args) => {
00431|     const user = await getAuthenticatedUser(ctx);
00432|     requireRole(user, ["port_admin", "terminal_operator"]);
00433| 
00434|     const booking = await ctx.db.get(args.bookingId);
00435|     if (!booking) {
00436|       throw new ConvexError({
00437|         code: "NOT_FOUND",
00438|         message: "Booking not found",
00439|       });
00440|     }
00441| 
00442|     const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "consumed");
00443|     if (!canModify) {
00444|       throw new ConvexError({
00445|         code: "FORBIDDEN",
00446|         message: "You do not have permission to mark this booking as consumed",
00447|       });
00448|     }
00449| 
00450|     if (!isValidStatusTransition(booking.status, "consumed")) {
00451|       throw new ConvexError({
00452|         code: "INVALID_STATE",
00453|         message: `Cannot mark as consumed a booking with status "${booking.status}"`,
00454|       });
00455|     }
00456| 
00457|     const now = Date.now();
00458|     await ctx.db.patch(args.bookingId, {
00459|       status: "consumed",
00460|       consumedAt: now,
00461|       processedBy: user.userId,
00462|       updatedAt: now,
00463|     });
00464| 
00465|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00466|       bookingId: args.bookingId,
00467|       changeType: "status_changed",
00468|       previousValue: booking.status,
00469|       newValue: "consumed",
00470|       changedBy: user.userId,
00471|       note: args.note,
00472|       requiredRebook: false,
00473|     });
00474| 
00475|     return null;
00476|   },
00477| });
00478| 
00479| // ============================================================================
00480| // MODIFICATIONS (Non-capacity affecting)
00481| // ============================================================================
00482| 
00483| /**
00484|  * Update driver information (non-capacity affecting)
00485|  */
00486| export const updateDriver = mutation({
00487|   args: {
00488|     bookingId: v.id("bookings"),
00489|     driverName: v.optional(v.string()),
00490|     driverPhone: v.optional(v.string()),
00491|     driverIdNumber: v.optional(v.string()),
00492|   },
00493|   returns: v.null(),
00494|   handler: async (ctx, args) => {
00495|     const user = await getAuthenticatedUser(ctx);
00496| 
00497|     const booking = await ctx.db.get(args.bookingId);
00498|     if (!booking) {
00499|       throw new ConvexError({
00500|         code: "NOT_FOUND",
00501|         message: "Booking not found",
00502|       });
00503|     }
00504| 
00505|     // Carrier can update their own bookings
00506|     const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
00507|     if (!canView && !isPortAdmin(user)) {
00508|       throw new ConvexError({
00509|         code: "FORBIDDEN",
00510|         message: "You do not have permission to update this booking",
00511|       });
00512|     }
00513| 
00514|     // Can only update pending or confirmed bookings
00515|     if (booking.status !== "pending" && booking.status !== "confirmed") {
00516|       throw new ConvexError({
00517|         code: "INVALID_STATE",
00518|         message: `Cannot update a booking with status "${booking.status}"`,
00519|       });
00520|     }
00521| 
00522|     const previousValues = {
00523|       driverName: booking.driverName,
00524|       driverPhone: booking.driverPhone,
00525|       driverIdNumber: booking.driverIdNumber,
00526|     };
00527| 
00528|     await ctx.db.patch(args.bookingId, {
00529|       driverName: args.driverName?.trim() ?? booking.driverName,
00530|       driverPhone: args.driverPhone?.trim() ?? booking.driverPhone,
00531|       driverIdNumber: args.driverIdNumber?.trim() ?? booking.driverIdNumber,
00532|       updatedAt: Date.now(),
00533|     });
00534| 
00535|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00536|       bookingId: args.bookingId,
00537|       changeType: "driver_updated",
00538|       previousValue: JSON.stringify(previousValues),
00539|       newValue: JSON.stringify({
00540|         driverName: args.driverName?.trim() ?? booking.driverName,
00541|         driverPhone: args.driverPhone?.trim() ?? booking.driverPhone,
00542|         driverIdNumber: args.driverIdNumber?.trim() ?? booking.driverIdNumber,
00543|       }),
00544|       changedBy: user.userId,
00545|       requiredRebook: false,
00546|     });
00547| 
00548|     return null;
00549|   },
00550| });
00551| 
00552| /**
00553|  * Update cargo details (non-capacity affecting)
00554|  */
00555| export const updateDetails = mutation({
00556|   args: {
00557|     bookingId: v.id("bookings"),
00558|     containerNumber: v.optional(v.string()),
00559|     cargoDescription: v.optional(v.string()),
00560|   },
00561|   returns: v.null(),
00562|   handler: async (ctx, args) => {
00563|     const user = await getAuthenticatedUser(ctx);
00564| 
00565|     const booking = await ctx.db.get(args.bookingId);
00566|     if (!booking) {
00567|       throw new ConvexError({
00568|         code: "NOT_FOUND",
00569|         message: "Booking not found",
00570|       });
00571|     }
00572| 
00573|     const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
00574|     if (!canView && !isPortAdmin(user)) {
00575|       throw new ConvexError({
00576|         code: "FORBIDDEN",
00577|         message: "You do not have permission to update this booking",
00578|       });
00579|     }
00580| 
00581|     if (booking.status !== "pending" && booking.status !== "confirmed") {
00582|       throw new ConvexError({
00583|         code: "INVALID_STATE",
00584|         message: `Cannot update a booking with status "${booking.status}"`,
00585|       });
00586|     }
00587| 
00588|     const previousValues = {
00589|       containerNumber: booking.containerNumber,
00590|       cargoDescription: booking.cargoDescription,
00591|     };
00592| 
00593|     await ctx.db.patch(args.bookingId, {
00594|       containerNumber: args.containerNumber?.trim() ?? booking.containerNumber,
00595|       cargoDescription: args.cargoDescription?.trim() ?? booking.cargoDescription,
00596|       updatedAt: Date.now(),
00597|     });
00598| 
00599|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00600|       bookingId: args.bookingId,
00601|       changeType: "details_updated",
00602|       previousValue: JSON.stringify(previousValues),
00603|       newValue: JSON.stringify({
00604|         containerNumber: args.containerNumber?.trim() ?? booking.containerNumber,
00605|         cargoDescription: args.cargoDescription?.trim() ?? booking.cargoDescription,
00606|       }),
00607|       changedBy: user.userId,
00608|       requiredRebook: false,
00609|     });
00610| 
00611|     return null;
00612|   },
00613| });
00614| 
00615| /**
00616|  * Change truck (non-capacity affecting, but requires validation)
00617|  * Status stays the same
00618|  */
00619| export const changeTruck = mutation({
00620|   args: {
00621|     bookingId: v.id("bookings"),
00622|     newTruckId: v.id("trucks"),
00623|   },
00624|   returns: v.null(),
00625|   handler: async (ctx, args) => {
00626|     const user = await getAuthenticatedUser(ctx);
00627| 
00628|     const booking = await ctx.db.get(args.bookingId);
00629|     if (!booking) {
00630|       throw new ConvexError({
00631|         code: "NOT_FOUND",
00632|         message: "Booking not found",
00633|       });
00634|     }
00635| 
00636|     const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
00637|     if (!canView && !isPortAdmin(user)) {
00638|       throw new ConvexError({
00639|         code: "FORBIDDEN",
00640|         message: "You do not have permission to update this booking",
00641|       });
00642|     }
00643| 
00644|     if (booking.status !== "pending" && booking.status !== "confirmed") {
00645|       throw new ConvexError({
00646|         code: "INVALID_STATE",
00647|         message: `Cannot change truck for a booking with status "${booking.status}"`,
00648|       });
00649|     }
00650| 
00651|     // Validate new truck
00652|     const newTruck = await ctx.db.get(args.newTruckId);
00653|     if (!newTruck) {
00654|       throw new ConvexError({
00655|         code: "NOT_FOUND",
00656|         message: "New truck not found",
00657|       });
00658|     }
00659|     if (!newTruck.isActive) {
00660|       throw new ConvexError({
00661|         code: "INVALID_STATE",
00662|         message: "New truck is not active",
00663|       });
00664|     }
00665|     if (newTruck.carrierCompanyId !== booking.carrierCompanyId) {
00666|       throw new ConvexError({
00667|         code: "FORBIDDEN",
00668|         message: "New truck must belong to the same carrier company",
00669|       });
00670|     }
00671| 
00672|     // Validate compatibility with gate
00673|     const compatibility = await validateTruckForGate(ctx, args.newTruckId, booking.gateId);
00674|     if (!compatibility.valid) {
00675|       throw new ConvexError({
00676|         code: "INVALID_INPUT",
00677|         message: compatibility.reason ?? "New truck is not compatible with the gate",
00678|       });
00679|     }
00680| 
00681|     // Check new truck doesn't have a booking for this slot
00682|     const existingBooking = await ctx.db
00683|       .query("bookings")
00684|       .withIndex("by_truck", (q) => q.eq("truckId", args.newTruckId))
00685|       .filter((q) =>
00686|         q.and(
00687|           q.eq(q.field("timeSlotId"), booking.timeSlotId),
00688|           q.neq(q.field("_id"), args.bookingId),
00689|           q.or(
00690|             q.eq(q.field("status"), "pending"),
00691|             q.eq(q.field("status"), "confirmed")
00692|           )
00693|         )
00694|       )
00695|       .first();
00696| 
00697|     if (existingBooking) {
00698|       throw new ConvexError({
00699|         code: "DUPLICATE",
00700|         message: "The new truck already has a booking for this time slot",
00701|       });
00702|     }
00703| 
00704|     const previousTruckId = booking.truckId;
00705| 
00706|     await ctx.db.patch(args.bookingId, {
00707|       truckId: args.newTruckId,
00708|       updatedAt: Date.now(),
00709|     });
00710| 
00711|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00712|       bookingId: args.bookingId,
00713|       changeType: "truck_changed",
00714|       previousValue: previousTruckId,
00715|       newValue: args.newTruckId,
00716|       changedBy: user.userId,
00717|       requiredRebook: false,
00718|     });
00719| 
00720|     return null;
00721|   },
00722| });
00723| 
00724| // ============================================================================
00725| // CAPACITY-AFFECTING CHANGES (Rebook)
00726| // ============================================================================
00727| 
00728| /**
00729|  * Change time slot (capacity-affecting - resets to pending)
00730|  */
00731| export const changeTimeSlot = mutation({
00732|   args: {
00733|     bookingId: v.id("bookings"),
00734|     newTimeSlotId: v.id("timeSlots"),
00735|   },
00736|   returns: v.null(),
00737|   handler: async (ctx, args) => {
00738|     const user = await getAuthenticatedUser(ctx);
00739| 
00740|     const booking = await ctx.db.get(args.bookingId);
00741|     if (!booking) {
00742|       throw new ConvexError({
00743|         code: "NOT_FOUND",
00744|         message: "Booking not found",
00745|       });
00746|     }
00747| 
00748|     const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
00749|     if (!canView && !isPortAdmin(user)) {
00750|       throw new ConvexError({
00751|         code: "FORBIDDEN",
00752|         message: "You do not have permission to update this booking",
00753|       });
00754|     }
00755| 
00756|     if (booking.status !== "pending" && booking.status !== "confirmed") {
00757|       throw new ConvexError({
00758|         code: "INVALID_STATE",
00759|         message: `Cannot change time slot for a booking with status "${booking.status}"`,
00760|       });
00761|     }
00762| 
00763|     // Validate new time slot
00764|     const newTimeSlot = await ctx.db.get(args.newTimeSlotId);
00765|     if (!newTimeSlot) {
00766|       throw new ConvexError({
00767|         code: "NOT_FOUND",
00768|         message: "New time slot not found",
00769|       });
00770|     }
00771|     if (!newTimeSlot.isActive) {
00772|       throw new ConvexError({
00773|         code: "INVALID_STATE",
00774|         message: "New time slot is not available",
00775|       });
00776|     }
00777| 
00778|     // Validate time slot is in the future
00779|     const slotDateTime = new Date(`${newTimeSlot.date}T${newTimeSlot.startTime}`);
00780|     if (slotDateTime <= new Date()) {
00781|       throw new ConvexError({
00782|         code: "INVALID_INPUT",
00783|         message: "Cannot book a time slot in the past",
00784|       });
00785|     }
00786| 
00787|     // Validate truck compatibility with new gate
00788|     const compatibility = await validateTruckForGate(ctx, booking.truckId, newTimeSlot.gateId);
00789|     if (!compatibility.valid) {
00790|       throw new ConvexError({
00791|         code: "INVALID_INPUT",
00792|         message: compatibility.reason ?? "Truck is not compatible with the new gate",
00793|       });
00794|     }
00795| 
00796|     // Check truck doesn't have another booking for new slot
00797|     const existingBooking = await ctx.db
00798|       .query("bookings")
00799|       .withIndex("by_truck", (q) => q.eq("truckId", booking.truckId))
00800|       .filter((q) =>
00801|         q.and(
00802|           q.eq(q.field("timeSlotId"), args.newTimeSlotId),
00803|           q.neq(q.field("_id"), args.bookingId),
00804|           q.or(
00805|             q.eq(q.field("status"), "pending"),
00806|             q.eq(q.field("status"), "confirmed")
00807|           )
00808|         )
00809|       )
00810|       .first();
00811| 
00812|     if (existingBooking) {
00813|       throw new ConvexError({
00814|         code: "DUPLICATE",
00815|         message: "This truck already has a booking for the new time slot",
00816|       });
00817|     }
00818| 
00819|     // Reserve capacity on new slot first
00820|     const reserved = await checkAndReserveCapacity(ctx, args.newTimeSlotId);
00821|     if (!reserved) {
00822|       throw new ConvexError({
00823|         code: "CAPACITY_FULL",
00824|         message: "The new time slot is fully booked",
00825|       });
00826|     }
00827| 
00828|     // Release capacity from old slot
00829|     await releaseCapacity(ctx, booking.timeSlotId);
00830| 
00831|     // Get new gate/terminal info
00832|     const newGate = await ctx.db.get(newTimeSlot.gateId);
00833| 
00834|     const previousTimeSlotId = booking.timeSlotId;
00835|     const wasConfirmed = booking.status === "confirmed";
00836| 
00837|     await ctx.db.patch(args.bookingId, {
00838|       timeSlotId: args.newTimeSlotId,
00839|       gateId: newTimeSlot.gateId,
00840|       terminalId: newGate?.terminalId ?? booking.terminalId,
00841|       status: "pending", // Reset to pending for re-confirmation
00842|       confirmedAt: undefined, // Clear confirmation
00843|       processedBy: undefined,
00844|       updatedAt: Date.now(),
00845|     });
00846| 
00847|     await ctx.runMutation(internal.bookings.internal.recordHistory, {
00848|       bookingId: args.bookingId,
00849|       changeType: "time_slot_changed",
00850|       previousValue: previousTimeSlotId,
00851|       newValue: args.newTimeSlotId,
00852|       changedBy: user.userId,
00853|       note: wasConfirmed ? "Booking reset to pending for re-confirmation" : undefined,
00854|       requiredRebook: wasConfirmed,
00855|     });
00856| 
00857|     return null;
00858|   },
00859| });
00860| 

(End of file - total 860 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/ai/agent.ts"
}
```

**Output:**
```
<file>
00001| "use node";
00002| /**
00003|  * APCS Agent Definition
00004|  *
00005|  * Main AI agent configured with Google Gemini.
00006|  * The agent uses role-based tools to interact with the port logistics system.
00007|  *
00008|  * All tools are registered at the agent level for full type safety.
00009|  * Role-based access control is enforced inside each tool handler
00010|  * (see tools/*.ts and checkToolAccess in tools/types.ts).
00011|  */
00012| import { google } from "@ai-sdk/google";
00013| import { Agent } from "@convex-dev/agent";
00014| import { components } from "../_generated/api";
00015| import { ALL_TOOLS } from "./registry";
00016| 
00017| // ============================================================================
00018| // AGENT
00019| // ============================================================================
00020| 
00021| /**
00022|  * The main APCS assistant agent.
00023|  *
00024|  * All tools are statically defined here for full type safety.
00025|  * Each tool internally checks the caller's role before returning data.
00026|  */
00027| export const apcsAgent = new Agent(components.agent, {
00028|   name: "APCS Assistant",
00029|   languageModel: google("gemini-2.0-flash"),
00030|   instructions: `You are the APCS (Advanced Port Container System) assistant.
00031| You help users manage port terminal operations, truck bookings, and logistics.
00032| 
00033| Key facts:
00034| - The system has terminals, each with gates. Gates have time slots for truck bookings.
00035| - There are three user roles: port_admin, terminal_operator, and carrier.
00036| - Bookings follow a lifecycle: pending → confirmed/rejected → consumed/cancelled/expired.
00037| - Trucks are classified by type (container, flatbed, tanker, etc.) and class (light, medium, heavy, super_heavy).
00038| 
00039| Guidelines:
00040| - Always use the available tools to fetch real data. Never make up information.
00041| - When showing bookings, terminals, or slots, present data in a clear structured way.
00042| - If the user asks about policies, use the getSystemConfig tool.
00043| - If the user asks for something you don't have a tool for, let them know politely.
00044| - If a tool returns an ACCESS_DENIED error, explain that the user's role does not allow this action.
00045| - Respond in the same language the user writes in (French or English).
00046| - Be concise but thorough.`,
00047|   tools: ALL_TOOLS,
00048|   maxSteps: 5,
00049| });
00050| 

(End of file - total 50 lines)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 5.3s)

Now let me read the AI registry and crons to complete my understanding:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/ai/registry.ts"
}
```

**Output:**
```
<file>
00001| /**
00002|  * Tool Registry
00003|  *
00004|  * Central registry of all agent tools. Provides role-based filtering
00005|  * so the agent only sees tools the current user is allowed to use.
00006|  *
00007|  * To add a new tool:
00008|  * 1. Create the tool in the appropriate file under ./tools/
00009|  * 2. Import and add it to ALL_TOOLS below
00010|  * 3. Add the tool name to TOOL_PERMISSIONS in ./tools/types.ts for the appropriate roles
00011|  * 4. (Optional) Add the corresponding internal query in ./internalQueries.ts
00012|  */
00013| import type { ApcsRole } from "../lib/validators";
00014| import { getToolNamesForRole } from "./tools/types";
00015| 
00016| // Import all tools
00017| import {
00018|   listMyBookings,
00019|   getBookingDetails,
00020|   listBookingsByTerminal,
00021|   listBookingsByCarrier,
00022|   listPendingBookings,
00023| } from "./tools/bookings";
00024| import {
00025|   listTerminals,
00026|   getTerminalDetails,
00027|   getAvailableSlots,
00028| } from "./tools/terminals";
00029| import { getSystemConfig } from "./tools/config";
00030| 
00031| // ============================================================================
00032| // ALL TOOLS (name -> tool)
00033| // ============================================================================
00034| 
00035| /**
00036|  * Complete map of every tool in the system.
00037|  * Keys must match what's in TOOL_PERMISSIONS.
00038|  */
00039| export const ALL_TOOLS = {
00040|   listMyBookings,
00041|   getBookingDetails,
00042|   listBookingsByTerminal,
00043|   listBookingsByCarrier,
00044|   listPendingBookings,
00045|   listTerminals,
00046|   getTerminalDetails,
00047|   getAvailableSlots,
00048|   getSystemConfig,
00049| } as const;
00050| 
00051| export type ToolName = keyof typeof ALL_TOOLS;
00052| 
00053| // ============================================================================
00054| // ROLE-BASED FILTERING
00055| // ============================================================================
00056| 
00057| /**
00058|  * Return only the tools the given role can access.
00059|  * This is passed to the agent when starting a conversation.
00060|  */
00061| export function getToolsForRole(role: ApcsRole): Record<string, (typeof ALL_TOOLS)[ToolName]> {
00062|   const allowed = getToolNamesForRole(role);
00063|   const filtered: Record<string, (typeof ALL_TOOLS)[ToolName]> = {};
00064| 
00065|   for (const name of allowed) {
00066|     if (name in ALL_TOOLS) {
00067|       filtered[name] = ALL_TOOLS[name as ToolName];
00068|     }
00069|   }
00070| 
00071|   return filtered;
00072| }
00073| 

(End of file - total 73 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/crons.ts"
}
```

**Output:**
```
<file>
00001| /**
00002|  * APCS Scheduled Jobs (Cron)
00003|  * Automated background tasks for booking management
00004|  */
00005| import { cronJobs } from "convex/server";
00006| import { internal } from "./_generated/api";
00007| 
00008| const crons = cronJobs();
00009| 
00010| // ============================================================================
00011| // BOOKING EXPIRATION
00012| // ============================================================================
00013| 
00014| /**
00015|  * Expire old bookings that were not consumed
00016|  * Runs every 15 minutes
00017|  */
00018| crons.interval(
00019|   "expire old bookings",
00020|   { minutes: 15 },
00021|   internal.scheduled.expireOldBookings,
00022|   {}
00023| );
00024| 
00025| // ============================================================================
00026| // BOOKING REMINDERS
00027| // ============================================================================
00028| 
00029| /**
00030|  * Send 24-hour reminders for upcoming confirmed bookings
00031|  * Runs every hour
00032|  */
00033| crons.interval(
00034|   "send 24h booking reminders",
00035|   { hours: 1 },
00036|   internal.scheduled.sendBookingReminders,
00037|   { hoursBeforeSlot: 24 }
00038| );
00039| 
00040| /**
00041|  * Send 2-hour reminders for upcoming confirmed bookings
00042|  * Runs every 30 minutes
00043|  */
00044| crons.interval(
00045|   "send 2h booking reminders",
00046|   { minutes: 30 },
00047|   internal.scheduled.sendBookingReminders,
00048|   { hoursBeforeSlot: 2 }
00049| );
00050| 
00051| // ============================================================================
00052| // CLEANUP JOBS
00053| // ============================================================================
00054| 
00055| /**
00056|  * Cleanup old notifications (older than 30 days)
00057|  * Runs daily at 2 AM UTC
00058|  */
00059| crons.cron(
00060|   "cleanup old notifications",
00061|   "0 2 * * *",
00062|   internal.scheduled.cleanupOldNotifications,
00063|   { daysToKeep: 30 }
00064| );
00065| 
00066| /**
00067|  * Cleanup old booking history (audit logs older than 90 days)
00068|  * Runs weekly on Sunday at 3 AM UTC
00069|  */
00070| crons.cron(
00071|   "cleanup old booking history",
00072|   "0 3 * * 0",
00073|   internal.scheduled.cleanupOldBookingHistory,
00074|   { daysToKeep: 90 }
00075| );
00076| 
00077| // ============================================================================
00078| // DATA CONSISTENCY CHECKS
00079| // ============================================================================
00080| 
00081| /**
00082|  * Recalculate time slot capacity (data consistency check)
00083|  * Runs daily at 4 AM UTC
00084|  */
00085| crons.cron(
00086|   "recalculate slot capacity",
00087|   "0 4 * * *",
00088|   internal.scheduled.recalculateAllCapacity,
00089|   {}
00090| );
00091| 
00092| export default crons;
00093| 

(End of file - total 93 lines)
</file>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/packages/backend/convex/notifications/internal.ts"
}
```

**Output:**
```
<file>
00001| /**
00002|  * Internal Notification Functions
00003|  * Server-side notification creation and sending
00004|  */
00005| import { internalMutation, internalQuery } from "../_generated/server";
00006| import { v } from "convex/values";
00007| import type { MutationCtx } from "../_generated/server";
00008| import type { Id } from "../_generated/dataModel";
00009| import {
00010|   notificationTypeValidator,
00011|   notificationChannelValidator,
00012|   type NotificationType,
00013|   type NotificationChannel,
00014|   type Language,
00015| } from "../lib/validators";
00016| 
00017| // ============================================================================
00018| // NOTIFICATION TEMPLATES (Bilingual)
00019| // ============================================================================
00020| 
00021| type NotificationTemplate = {
00022|   titleEn: string;
00023|   titleFr: string;
00024|   bodyEn: string;
00025|   bodyFr: string;
00026| };
00027| 
00028| type TemplateParams = {
00029|   bookingReference?: string;
00030|   terminalName?: string;
00031|   gateName?: string;
00032|   date?: string;
00033|   time?: string;
00034|   reason?: string;
00035|   hoursUntil?: number;
00036| };
00037| 
00038| function getNotificationTemplate(
00039|   type: NotificationType,
00040|   params: TemplateParams
00041| ): NotificationTemplate {
00042|   switch (type) {
00043|     case "booking_created":
00044|       return {
00045|         titleEn: "Booking Created",
00046|         titleFr: "Réservation créée",
00047|         bodyEn: `Your booking ${params.bookingReference} has been created for ${params.date} at ${params.time}. It is pending confirmation.`,
00048|         bodyFr: `Votre réservation ${params.bookingReference} a été créée pour le ${params.date} à ${params.time}. Elle est en attente de confirmation.`,
00049|       };
00050| 
00051|     case "booking_confirmed":
00052|       return {
00053|         titleEn: "Booking Confirmed",
00054|         titleFr: "Réservation confirmée",
00055|         bodyEn: `Your booking ${params.bookingReference} has been confirmed for ${params.terminalName}, Gate ${params.gateName} on ${params.date} at ${params.time}.`,
00056|         bodyFr: `Votre réservation ${params.bookingReference} a été confirmée pour ${params.terminalName}, Porte ${params.gateName} le ${params.date} à ${params.time}.`,
00057|       };
00058| 
00059|     case "booking_rejected":
00060|       return {
00061|         titleEn: "Booking Rejected",
00062|         titleFr: "Réservation refusée",
00063|         bodyEn: `Your booking ${params.bookingReference} has been rejected. Reason: ${params.reason || "Not specified"}.`,
00064|         bodyFr: `Votre réservation ${params.bookingReference} a été refusée. Raison: ${params.reason || "Non spécifiée"}.`,
00065|       };
00066| 
00067|     case "booking_cancelled":
00068|       return {
00069|         titleEn: "Booking Cancelled",
00070|         titleFr: "Réservation annulée",
00071|         bodyEn: `Your booking ${params.bookingReference} has been cancelled.${params.reason ? ` Reason: ${params.reason}` : ""}`,
00072|         bodyFr: `Votre réservation ${params.bookingReference} a été annulée.${params.reason ? ` Raison: ${params.reason}` : ""}`,
00073|       };
00074| 
00075|     case "booking_modified":
00076|       return {
00077|         titleEn: "Booking Modified",
00078|         titleFr: "Réservation modifiée",
00079|         bodyEn: `Your booking ${params.bookingReference} has been modified. Please review the changes.`,
00080|         bodyFr: `Votre réservation ${params.bookingReference} a été modifiée. Veuillez vérifier les changements.`,
00081|       };
00082| 
00083|     case "booking_reminder":
00084|       return {
00085|         titleEn: "Booking Reminder",
00086|         titleFr: "Rappel de réservation",
00087|         bodyEn: `Reminder: Your booking ${params.bookingReference} is scheduled in ${params.hoursUntil} hours at ${params.terminalName}, Gate ${params.gateName}.`,
00088|         bodyFr: `Rappel: Votre réservation ${params.bookingReference} est prévue dans ${params.hoursUntil} heures à ${params.terminalName}, Porte ${params.gateName}.`,
00089|       };
00090| 
00091|     case "booking_expired":
00092|       return {
00093|         titleEn: "Booking Expired",
00094|         titleFr: "Réservation expirée",
00095|         bodyEn: `Your booking ${params.bookingReference} has expired as it was not used within the scheduled time.`,
00096|         bodyFr: `Votre réservation ${params.bookingReference} a expiré car elle n'a pas été utilisée dans les délais prévus.`,
00097|       };
00098| 
00099|     case "capacity_alert":
00100|       return {
00101|         titleEn: "Capacity Alert",
00102|         titleFr: "Alerte de capacité",
00103|         bodyEn: `High demand detected at ${params.terminalName}. Some time slots may be limited.`,
00104|         bodyFr: `Forte demande détectée à ${params.terminalName}. Certains créneaux horaires peuvent être limités.`,
00105|       };
00106| 
00107|     case "system_announcement":
00108|       return {
00109|         titleEn: "System Announcement",
00110|         titleFr: "Annonce système",
00111|         bodyEn: params.reason || "Important system update.",
00112|         bodyFr: params.reason || "Mise à jour importante du système.",
00113|       };
00114| 
00115|     default:
00116|       return {
00117|         titleEn: "Notification",
00118|         titleFr: "Notification",
00119|         bodyEn: "You have a new notification.",
00120|         bodyFr: "Vous avez une nouvelle notification.",
00121|       };
00122|   }
00123| }
00124| 
00125| // ============================================================================
00126| // INTERNAL MUTATIONS
00127| // ============================================================================
00128| 
00129| /**
00130|  * Create a notification for a user
00131|  */
00132| export const createNotification = internalMutation({
00133|   args: {
00134|     userId: v.string(),
00135|     type: notificationTypeValidator,
00136|     channel: notificationChannelValidator,
00137|     params: v.object({
00138|       bookingReference: v.optional(v.string()),
00139|       terminalName: v.optional(v.string()),
00140|       gateName: v.optional(v.string()),
00141|       date: v.optional(v.string()),
00142|       time: v.optional(v.string()),
00143|       reason: v.optional(v.string()),
00144|       hoursUntil: v.optional(v.number()),
00145|     }),
00146|     relatedEntityType: v.optional(
00147|       v.union(v.literal("booking"), v.literal("terminal"), v.literal("time_slot"))
00148|     ),
00149|     relatedEntityId: v.optional(v.string()),
00150|   },
00151|   returns: v.id("notifications"),
00152|   handler: async (ctx, args) => {
00153|     const template = getNotificationTemplate(args.type, args.params);
00154| 
00155|     const notificationId = await ctx.db.insert("notifications", {
00156|       userId: args.userId,
00157|       type: args.type,
00158|       channel: args.channel,
00159|       titleEn: template.titleEn,
00160|       titleFr: template.titleFr,
00161|       bodyEn: template.bodyEn,
00162|       bodyFr: template.bodyFr,
00163|       relatedEntityType: args.relatedEntityType,
00164|       relatedEntityId: args.relatedEntityId,
00165|       isRead: false,
00166|       createdAt: Date.now(),
00167|     });
00168| 
00169|     // If channel includes email, queue email send
00170|     // (In production, this would trigger an action to send email)
00171|     if (args.channel === "email" || args.channel === "both") {
00172|       // TODO: Schedule email sending action
00173|       // await ctx.scheduler.runAfter(0, internal.email.sendNotificationEmail, { notificationId });
00174|     }
00175| 
00176|     return notificationId;
00177|   },
00178| });
00179| 
00180| /**
00181|  * Send booking notification to carrier company users
00182|  */
00183| export const sendBookingNotification = internalMutation({
00184|   args: {
00185|     bookingId: v.id("bookings"),
00186|     type: notificationTypeValidator,
00187|     additionalParams: v.optional(
00188|       v.object({
00189|         reason: v.optional(v.string()),
00190|       })
00191|     ),
00192|   },
00193|   returns: v.array(v.id("notifications")),
00194|   handler: async (ctx, args) => {
00195|     const booking = await ctx.db.get(args.bookingId);
00196|     if (!booking) return [];
00197| 
00198|     // Get related entities
00199|     const [timeSlot, gate, terminal, carrier] = await Promise.all([
00200|       ctx.db.get(booking.timeSlotId),
00201|       ctx.db.get(booking.gateId),
00202|       ctx.db.get(booking.terminalId),
00203|       ctx.db.get(booking.carrierCompanyId),
00204|     ]);
00205| 
00206|     if (!carrier) return [];
00207| 
00208|     // Get all active users in the carrier company
00209|     const carrierUsers = await ctx.db
00210|       .query("carrierUsers")
00211|       .withIndex("by_company_and_active", (q) =>
00212|         q.eq("carrierCompanyId", booking.carrierCompanyId).eq("isActive", true)
00213|       )
00214|       .collect();
00215| 
00216|     const notificationIds: Id<"notifications">[] = [];
00217| 
00218|     const params: TemplateParams = {
00219|       bookingReference: booking.bookingReference,
00220|       terminalName: terminal?.name,
00221|       gateName: gate?.name,
00222|       date: timeSlot?.date,
00223|       time: timeSlot?.startTime,
00224|       reason: args.additionalParams?.reason,
00225|     };
00226| 
00227|     // Create notification for each user
00228|     for (const carrierUser of carrierUsers) {
00229|       const notificationId = await ctx.db.insert("notifications", {
00230|         userId: carrierUser.userId,
00231|         type: args.type,
00232|         channel: carrier.notificationChannel,
00233|         ...getNotificationTemplate(args.type, params),
00234|         relatedEntityType: "booking",
00235|         relatedEntityId: booking._id,
00236|         isRead: false,
00237|         createdAt: Date.now(),
00238|       });
00239| 
00240|       notificationIds.push(notificationId);
00241|     }
00242| 
00243|     return notificationIds;
00244|   },
00245| });
00246| 
00247| /**
00248|  * Send reminder notifications for upcoming bookings
00249|  */
00250| export const sendBookingReminders = internalMutation({
00251|   args: {
00252|     hoursBeforeSlot: v.number(),
00253|   },
00254|   returns: v.number(), // Count of reminders sent
00255|   handler: async (ctx, args) => {
00256|     const now = Date.now();
00257|     const targetTime = now + args.hoursBeforeSlot * 60 * 60 * 1000;
00258| 
00259|     // Find confirmed bookings with time slots approaching
00260|     // We need to find time slots that start around targetTime
00261|     const targetDate = new Date(targetTime);
00262|     const dateStr = targetDate.toISOString().slice(0, 10);
00263|     const hourStr = targetDate.toISOString().slice(11, 16);
00264| 
00265|     // Get time slots for today and tomorrow that might need reminders
00266|     const dates = [
00267|       dateStr,
00268|       new Date(targetTime + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
00269|     ];
00270| 
00271|     let reminderCount = 0;
00272| 
00273|     for (const date of dates) {
00274|       const timeSlots = await ctx.db
00275|         .query("timeSlots")
00276|         .withIndex("by_date", (q) => q.eq("date", date))
00277|         .collect();
00278| 
00279|       for (const slot of timeSlots) {
00280|         const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
00281|         const hoursUntil = (slotDateTime.getTime() - now) / (1000 * 60 * 60);
00282| 
00283|         // Check if this slot is within 30 minutes of the target reminder time
00284|         if (Math.abs(hoursUntil - args.hoursBeforeSlot) <= 0.5) {
00285|           // Find confirmed bookings for this slot
00286|           const bookings = await ctx.db
00287|             .query("bookings")
00288|             .withIndex("by_time_slot_and_status", (q) =>
00289|               q.eq("timeSlotId", slot._id).eq("status", "confirmed")
00290|             )
00291|             .collect();
00292| 
00293|           for (const booking of bookings) {
00294|             // Send reminder notification
00295|             const carrier = await ctx.db.get(booking.carrierCompanyId);
00296|             const terminal = await ctx.db.get(booking.terminalId);
00297|             const gate = await ctx.db.get(booking.gateId);
00298| 
00299|             if (!carrier) continue;
00300| 
00301|             const carrierUsers = await ctx.db
00302|               .query("carrierUsers")
00303|               .withIndex("by_company_and_active", (q) =>
00304|                 q.eq("carrierCompanyId", booking.carrierCompanyId).eq("isActive", true)
00305|               )
00306|               .collect();
00307| 
00308|             const params: TemplateParams = {
00309|               bookingReference: booking.bookingReference,
00310|               terminalName: terminal?.name,
00311|               gateName: gate?.name,
00312|               hoursUntil: Math.round(hoursUntil),
00313|             };
00314| 
00315|             for (const carrierUser of carrierUsers) {
00316|               await ctx.db.insert("notifications", {
00317|                 userId: carrierUser.userId,
00318|                 type: "booking_reminder",
00319|                 channel: carrier.notificationChannel,
00320|                 ...getNotificationTemplate("booking_reminder", params),
00321|                 relatedEntityType: "booking",
00322|                 relatedEntityId: booking._id,
00323|                 isRead: false,
00324|                 createdAt: Date.now(),
00325|               });
00326| 
00327|               reminderCount++;
00328|             }
00329|           }
00330|         }
00331|       }
00332|     }
00333| 
00334|     return reminderCount;
00335|   },
00336| });
00337| 
00338| /**
00339|  * Helper to send notification to specific users
00340|  */
00341| export async function notifyUsers(
00342|   ctx: MutationCtx,
00343|   userIds: string[],
00344|   type: NotificationType,
00345|   channel: NotificationChannel,
00346|   params: TemplateParams,
00347|   relatedEntity?: { type: "booking" | "terminal" | "time_slot"; id: string }
00348| ): Promise<Id<"notifications">[]> {
00349|   const template = getNotificationTemplate(type, params);
00350|   const notificationIds: Id<"notifications">[] = [];
00351| 
00352|   for (const userId of userIds) {
00353|     const notificationId = await ctx.db.insert("notifications", {
00354|       userId,
00355|       type,
00356|       channel,
00357|       ...template,
00358|       relatedEntityType: relatedEntity?.type,
00359|       relatedEntityId: relatedEntity?.id,
00360|       isRead: false,
00361|       createdAt: Date.now(),
00362|     });
00363| 
00364|     notificationIds.push(notificationId);
00365|   }
00366| 
00367|   return notificationIds;
00368| }
00369| 

(End of file - total 369 lines)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 346.5s)

Excellent! Now I have a comprehensive understanding of the existing codebase. Let me write the exhaustive backend implementation plan with full details. I'll update the plan file with the complete implementation specifications.

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "content": "# APCS Maritime Port Booking System - Exhaustive Backend Implementation Plan\n\n## Executive Summary\n\nThis plan details the complete backend implementation for APCS (Advanced Port Container System). The system transforms from a gate-level booking model to a **terminal-level capacity model** with **container-centric bookings** and a **French-only AI assistant**.\n\n### Key Architectural Changes\n\n| Current State | Target State |\n|--------------|--------------|\n| Carrier companies own trucks | Trucks owned directly by carrier users |\n| Gate-level capacity | Terminal-level capacity (truck count) |\n| Single container per booking | Multiple containers per booking |\n| Manual approval only | Auto-validation (first N% auto-approved) |\n| Gate assigned at booking | Gate assigned at approval |\n| Bilingual (EN/FR) | French only |\n| No containers table | Pre-seeded containers assigned to carriers |\n\n---\n\n## Phase 1: Schema Refactoring\n\n**Files to Modify:**\n- `packages/backend/convex/schema.ts` (major refactor)\n- `packages/backend/convex/lib/validators.ts` (add new validators)\n\n### 1.1 Tables to Remove\n\n```typescript\n// DELETE these tables entirely\ncarrierCompanies: defineTable({ ... })  // REMOVE\ncarrierUsers: defineTable({ ... })      // REMOVE\n```\n\n### 1.2 New `containers` Table\n\n```typescript\n/** Container type (ISO standard classifications) */\nexport const containerTypeValidator = v.union(\n  v.literal(\"dry\"),           // Standard dry container\n  v.literal(\"reefer\"),        // Refrigerated\n  v.literal(\"open_top\"),      // Open top\n  v.literal(\"flat_rack\"),     // Flat rack\n  v.literal(\"tank\"),          // Tank container\n  v.literal(\"hazardous\")      // Hazardous materials\n);\n\n/** Container dimensions (ISO standard) */\nexport const containerDimensionsValidator = v.union(\n  v.literal(\"20ft\"),          // 20' standard\n  v.literal(\"40ft\"),          // 40' standard\n  v.literal(\"40ft_hc\"),       // 40' high cube\n  v.literal(\"45ft\")           // 45' high cube\n);\n\n/** Container weight class */\nexport const containerWeightClassValidator = v.union(\n  v.literal(\"light\"),         // < 10 tons\n  v.literal(\"medium\"),        // 10-20 tons\n  v.literal(\"heavy\"),         // 20-30 tons\n  v.literal(\"super_heavy\")    // > 30 tons\n);\n\n/** Container operation type */\nexport const containerOperationValidator = v.union(\n  v.literal(\"pick_up\"),       // Carrier picks up from terminal\n  v.literal(\"drop_off\")       // Carrier drops off at terminal\n);\n\ncontainers: defineTable({\n  // Ownership\n  ownerId: v.string(),                          // Better Auth user ID (carrier role)\n  \n  // ISO 6346 container identification\n  containerNumber: v.string(),                   // e.g., \"MSCU1234567\"\n  \n  // Classification\n  containerType: containerTypeValidator,\n  dimensions: containerDimensionsValidator,\n  weightClass: containerWeightClassValidator,\n  \n  // Operation details\n  operationType: containerOperationValidator,\n  \n  // For pick_up: when container will be ready for collection\n  readyDate: v.optional(v.number()),\n  // For drop_off: expected departure date from terminal\n  departureDate: v.optional(v.number()),\n  \n  // State\n  isEmpty: v.boolean(),                          // Empty vs loaded\n  isActive: v.boolean(),                         // Soft delete flag\n  \n  // Booking association (null if not booked)\n  bookingId: v.optional(v.id(\"bookings\")),\n  \n  // Metadata\n  notes: v.optional(v.string()),\n  createdAt: v.number(),\n  updatedAt: v.number(),\n})\n  .index(\"by_owner\", [\"ownerId\"])\n  .index(\"by_owner_and_active\", [\"ownerId\", \"isActive\"])\n  .index(\"by_container_number\", [\"containerNumber\"])\n  .index(\"by_operation\", [\"operationType\"])\n  .index(\"by_booking\", [\"bookingId\"])\n  .index(\"by_type\", [\"containerType\"])\n  .index(\"by_owner_and_operation\", [\"ownerId\", \"operationType\"])\n  .index(\"by_owner_available\", [\"ownerId\", \"isActive\", \"bookingId\"]),\n```\n\n### 1.3 Refactored `trucks` Table\n\n```typescript\ntrucks: defineTable({\n  // CHANGED: Direct ownership by carrier user (no company)\n  ownerId: v.string(),                           // Better Auth user ID (carrier role)\n  \n  licensePlate: v.string(),\n  truckType: truckTypeValidator,\n  truckClass: truckClassValidator,\n  \n  // Vehicle details\n  make: v.optional(v.string()),\n  model: v.optional(v.string()),\n  year: v.optional(v.number()),\n  maxWeight: v.optional(v.number()),             // Capacity in tons\n  \n  isActive: v.boolean(),\n  createdAt: v.number(),\n  updatedAt: v.number(),\n  createdBy: v.string(),\n})\n  // CHANGED indexes\n  .index(\"by_owner\", [\"ownerId\"])\n  .index(\"by_owner_and_active\", [\"ownerId\", \"isActive\"])\n  .index(\"by_license_plate\", [\"licensePlate\"])\n  .index(\"by_type\", [\"truckType\"])\n  .index(\"by_class\", [\"truckClass\"]),\n```\n\n### 1.4 Refactored `bookings` Table\n\n```typescript\nbookings: defineTable({\n  // CHANGED: Terminal-level (gate assigned later)\n  terminalId: v.id(\"terminals\"),\n  carrierId: v.string(),                         // Better Auth user ID (was carrierCompanyId)\n  truckId: v.id(\"trucks\"),\n  \n  // CHANGED: Gate assigned at approval, not booking\n  gateId: v.optional(v.id(\"gates\")),             // Now optional, assigned on confirm\n  \n  // CHANGED: Multiple containers per booking\n  containerIds: v.array(v.id(\"containers\")),\n  \n  // Reference (terminal-prefixed)\n  bookingReference: v.string(),                   // e.g., \"TER1-BK-001234\"\n  status: bookingStatusValidator,\n  \n  // ADDED: Auto-validation tracking\n  wasAutoValidated: v.boolean(),\n  \n  // Preferred slot (before gate assignment)\n  preferredDate: v.string(),                      // YYYY-MM-DD\n  preferredTimeStart: v.string(),                 // HH:mm\n  preferredTimeEnd: v.string(),                   // HH:mm\n  \n  // ADDED: QR scan timestamps\n  entryScannedAt: v.optional(v.number()),\n  exitScannedAt: v.optional(v.number()),\n  scannedByEntry: v.optional(v.string()),        // Operator who scanned entry\n  scannedByExit: v.optional(v.string()),         // Operator who scanned exit\n  \n  // QR code\n  qrCode: v.optional(v.string()),                 // Data URL\n  qrCodeStorageId: v.optional(v.id(\"_storage\")), // Convex file storage\n  \n  // Driver info\n  driverName: v.optional(v.string()),\n  driverPhone: v.optional(v.string()),\n  driverIdNumber: v.optional(v.string()),\n  \n  // Timestamps\n  bookedAt: v.number(),\n  confirmedAt: v.optional(v.number()),\n  rejectedAt: v.optional(v.number()),\n  cancelledAt: v.optional(v.number()),\n  expiredAt: v.optional(v.number()),\n  \n  // Status metadata\n  statusReason: v.optional(v.string()),\n  processedBy: v.optional(v.string()),\n  \n  createdBy: v.string(),\n  updatedAt: v.number(),\n})\n  .index(\"by_reference\", [\"bookingReference\"])\n  .index(\"by_carrier\", [\"carrierId\"])\n  .index(\"by_carrier_and_status\", [\"carrierId\", \"status\"])\n  .index(\"by_terminal\", [\"terminalId\"])\n  .index(\"by_terminal_and_status\", [\"terminalId\", \"status\"])\n  .index(\"by_terminal_and_date\", [\"terminalId\", \"preferredDate\"])\n  .index(\"by_gate\", [\"gateId\"])\n  .index(\"by_truck\", [\"truckId\"])\n  .index(\"by_status\", [\"status\"])\n  .index(\"by_date\", [\"preferredDate\"])\n  .index(\"by_created_by\", [\"createdBy\"]),\n```\n\n### 1.5 Refactored `timeSlots` Table\n\n```typescript\ntimeSlots: defineTable({\n  // CHANGED: Terminal-level, not gate-level\n  terminalId: v.id(\"terminals\"),\n  \n  date: v.string(),                               // YYYY-MM-DD\n  startTime: v.string(),                          // HH:mm (24h)\n  endTime: v.string(),                            // HH:mm (24h)\n  \n  // Terminal capacity (truck count)\n  maxCapacity: v.number(),\n  currentBookings: v.number(),                    // Confirmed + pending count\n  \n  // ADDED: Auto-validation threshold for this slot\n  autoValidationThreshold: v.optional(v.number()), // Override terminal default (0-100%)\n  \n  isActive: v.boolean(),\n  createdAt: v.number(),\n  updatedAt: v.number(),\n  createdBy: v.string(),\n})\n  // CHANGED indexes\n  .index(\"by_terminal\", [\"terminalId\"])\n  .index(\"by_terminal_and_date\", [\"terminalId\", \"date\"])\n  .index(\"by_date\", [\"date\"])\n  .index(\"by_terminal_and_active\", [\"terminalId\", \"isActive\"]),\n```\n\n### 1.6 Updated `terminals` Table\n\n```typescript\nterminals: defineTable({\n  name: v.string(),\n  code: v.string(),                               // e.g., \"TER1\"\n  address: v.optional(v.string()),\n  timezone: v.string(),\n  isActive: v.boolean(),\n  \n  // ADDED: Terminal-wide capacity settings\n  defaultSlotCapacity: v.number(),                // Default trucks per slot\n  autoValidationThreshold: v.number(),            // Default 0-100 (percentage)\n  \n  // ADDED: Capacity alert thresholds\n  capacityAlertThresholds: v.array(v.number()),   // e.g., [70, 85, 95]\n  \n  // ADDED: Operating hours\n  operatingHoursStart: v.string(),                // e.g., \"06:00\"\n  operatingHoursEnd: v.string(),                  // e.g., \"22:00\"\n  slotDurationMinutes: v.number(),                // e.g., 60\n  \n  createdAt: v.number(),\n  updatedAt: v.number(),\n  createdBy: v.string(),\n})\n  .index(\"by_code\", [\"code\"])\n  .index(\"by_active\", [\"isActive\"])\n  .index(\"by_created_by\", [\"createdBy\"]),\n```\n\n### 1.7 New `auditLogs` Table\n\n```typescript\n/** Audit action types */\nexport const auditActionValidator = v.union(\n  v.literal(\"query\"),\n  v.literal(\"mutation\"),\n  v.literal(\"ai_tool_call\"),\n  v.literal(\"login\"),\n  v.literal(\"logout\"),\n  v.literal(\"failed_auth\"),\n  v.literal(\"permission_denied\")\n);\n\nauditLogs: defineTable({\n  // Who\n  userId: v.optional(v.string()),                 // null for anonymous/failed auth\n  \n  // What\n  action: auditActionValidator,\n  resource: v.string(),                           // e.g., \"bookings.create\"\n  resourceId: v.optional(v.string()),             // Document ID if applicable\n  \n  // Details\n  args: v.optional(v.string()),                   // JSON string (sanitized, no secrets)\n  result: v.optional(v.string()),                 // \"success\", \"error:CODE\", etc.\n  errorMessage: v.optional(v.string()),\n  \n  // Context\n  ipAddress: v.optional(v.string()),\n  userAgent: v.optional(v.string()),\n  sessionId: v.optional(v.string()),\n  \n  // AI-specific\n  aiThreadId: v.optional(v.string()),\n  aiToolName: v.optional(v.string()),\n  \n  // Timing\n  timestamp: v.number(),\n  durationMs: v.optional(v.number()),\n})\n  .index(\"by_user\", [\"userId\"])\n  .index(\"by_action\", [\"action\"])\n  .index(\"by_resource\", [\"resource\"])\n  .index(\"by_timestamp\", [\"timestamp\"])\n  .index(\"by_user_and_action\", [\"userId\", \"action\"])\n  .index(\"by_ai_thread\", [\"aiThreadId\"]),\n```\n\n### 1.8 New `bookingAggregates` Table (Analytics)\n\n```typescript\n/** Aggregation period */\nexport const aggregationPeriodValidator = v.union(\n  v.literal(\"hourly\"),\n  v.literal(\"daily\"),\n  v.literal(\"weekly\")\n);\n\nbookingAggregates: defineTable({\n  // Scope\n  terminalId: v.id(\"terminals\"),\n  period: aggregationPeriodValidator,\n  date: v.string(),                               // YYYY-MM-DD\n  hour: v.optional(v.number()),                   // 0-23 for hourly aggregates\n  \n  // Booking counts by status\n  totalBookings: v.number(),\n  pendingCount: v.number(),\n  confirmedCount: v.number(),\n  rejectedCount: v.number(),\n  consumedCount: v.number(),\n  cancelledCount: v.number(),\n  expiredCount: v.number(),\n  autoValidatedCount: v.number(),\n  \n  // Capacity metrics\n  avgUtilizationPercent: v.number(),\n  peakUtilizationPercent: v.number(),\n  \n  // Container metrics\n  totalContainers: v.number(),\n  pickupCount: v.number(),\n  dropoffCount: v.number(),\n  \n  // Timing metrics (milliseconds)\n  avgWaitTimeMs: v.optional(v.number()),          // Time from booking to confirm\n  avgProcessingTimeMs: v.optional(v.number()),    // Time in terminal\n  \n  computedAt: v.number(),\n})\n  .index(\"by_terminal\", [\"terminalId\"])\n  .index(\"by_terminal_and_period\", [\"terminalId\", \"period\"])\n  .index(\"by_terminal_and_date\", [\"terminalId\", \"date\"])\n  .index(\"by_date\", [\"date\"]),\n```\n\n### 1.9 Updated `systemConfig` Table\n\n```typescript\nsystemConfig: defineTable({\n  // Booking window\n  maxAdvanceBookingDays: v.number(),              // e.g., 30\n  minAdvanceBookingHours: v.number(),             // e.g., 2\n  \n  // REMOVED: cancellationWindowHours (carriers can cancel anytime)\n  \n  // ADDED: No-show handling\n  noShowGracePeriodMinutes: v.number(),           // e.g., 30\n  \n  // ADDED: Auto-validation defaults\n  defaultAutoValidationThreshold: v.number(),     // 0-100, global default\n  \n  // Reminder settings\n  reminderHoursBefore: v.array(v.number()),\n  \n  // ADDED: Container settings\n  maxContainersPerBooking: v.number(),            // e.g., 10\n  \n  updatedAt: v.number(),\n  updatedBy: v.string(),\n}),\n```\n\n### 1.10 Updated `userProfiles` Table\n\n```typescript\nuserProfiles: defineTable({\n  userId: v.string(),\n  \n  // CHANGED: French only, but keep field for future\n  preferredLanguage: v.literal(\"fr\"),             // Always French\n  notificationChannel: notificationChannelValidator,\n  \n  phone: v.optional(v.string()),\n  \n  createdAt: v.number(),\n  updatedAt: v.number(),\n})\n  .index(\"by_user\", [\"userId\"]),\n```\n\n---\n\n## Phase 2: Core Backend Functions\n\n### 2.1 Container CRUD\n\n**File: `packages/backend/convex/containers/queries.ts`**\n\n```typescript\nimport { query } from \"../_generated/server\";\nimport { v } from \"convex/values\";\nimport { getAuthenticatedUser, requireRole, isPortAdmin } from \"../lib/permissions\";\n\n/**\n * List containers for the current carrier user\n */\nexport const listMy = query({\n  args: {\n    operationType: v.optional(containerOperationValidator),\n    includeBooked: v.optional(v.boolean()),       // Include containers in bookings\n    limit: v.optional(v.number()),\n  },\n  returns: v.array(v.object({\n    _id: v.id(\"containers\"),\n    containerNumber: v.string(),\n    containerType: containerTypeValidator,\n    dimensions: containerDimensionsValidator,\n    weightClass: containerWeightClassValidator,\n    operationType: containerOperationValidator,\n    isEmpty: v.boolean(),\n    bookingId: v.optional(v.id(\"bookings\")),\n    readyDate: v.optional(v.number()),\n    departureDate: v.optional(v.number()),\n  })),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"carrier\"]);\n\n    let query = ctx.db\n      .query(\"containers\")\n      .withIndex(\"by_owner_and_active\", q => \n        q.eq(\"ownerId\", user.userId).eq(\"isActive\", true)\n      );\n\n    const containers = await query.collect();\n\n    return containers\n      .filter(c => {\n        if (args.operationType && c.operationType !== args.operationType) return false;\n        if (!args.includeBooked && c.bookingId) return false;\n        return true;\n      })\n      .slice(0, args.limit ?? 100)\n      .map(c => ({\n        _id: c._id,\n        containerNumber: c.containerNumber,\n        containerType: c.containerType,\n        dimensions: c.dimensions,\n        weightClass: c.weightClass,\n        operationType: c.operationType,\n        isEmpty: c.isEmpty,\n        bookingId: c.bookingId,\n        readyDate: c.readyDate,\n        departureDate: c.departureDate,\n      }));\n  },\n});\n\n/**\n * Get available containers for booking (not already in a booking)\n */\nexport const listAvailable = query({\n  args: {\n    operationType: v.optional(containerOperationValidator),\n  },\n  returns: v.array(v.object({\n    _id: v.id(\"containers\"),\n    containerNumber: v.string(),\n    containerType: containerTypeValidator,\n    dimensions: containerDimensionsValidator,\n    operationType: containerOperationValidator,\n    isEmpty: v.boolean(),\n  })),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"carrier\"]);\n\n    const containers = await ctx.db\n      .query(\"containers\")\n      .withIndex(\"by_owner_available\", q =>\n        q.eq(\"ownerId\", user.userId).eq(\"isActive\", true).eq(\"bookingId\", undefined)\n      )\n      .collect();\n\n    return containers\n      .filter(c => !args.operationType || c.operationType === args.operationType)\n      .map(c => ({\n        _id: c._id,\n        containerNumber: c.containerNumber,\n        containerType: c.containerType,\n        dimensions: c.dimensions,\n        operationType: c.operationType,\n        isEmpty: c.isEmpty,\n      }));\n  },\n});\n\n/**\n * Get container details\n */\nexport const get = query({\n  args: { containerId: v.id(\"containers\") },\n  returns: v.union(v.null(), v.object({\n    _id: v.id(\"containers\"),\n    ownerId: v.string(),\n    containerNumber: v.string(),\n    containerType: containerTypeValidator,\n    dimensions: containerDimensionsValidator,\n    weightClass: containerWeightClassValidator,\n    operationType: containerOperationValidator,\n    isEmpty: v.boolean(),\n    isActive: v.boolean(),\n    bookingId: v.optional(v.id(\"bookings\")),\n    readyDate: v.optional(v.number()),\n    departureDate: v.optional(v.number()),\n    notes: v.optional(v.string()),\n  })),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    const container = await ctx.db.get(args.containerId);\n    \n    if (!container) return null;\n    \n    // Carriers can only see their own containers\n    if (!isPortAdmin(user) && container.ownerId !== user.userId) {\n      return null;\n    }\n\n    return {\n      _id: container._id,\n      ownerId: container.ownerId,\n      containerNumber: container.containerNumber,\n      containerType: container.containerType,\n      dimensions: container.dimensions,\n      weightClass: container.weightClass,\n      operationType: container.operationType,\n      isEmpty: container.isEmpty,\n      isActive: container.isActive,\n      bookingId: container.bookingId,\n      readyDate: container.readyDate,\n      departureDate: container.departureDate,\n      notes: container.notes,\n    };\n  },\n});\n```\n\n**File: `packages/backend/convex/containers/mutations.ts`**\n\n```typescript\nimport { mutation } from \"../_generated/server\";\nimport { v, ConvexError } from \"convex/values\";\nimport { getAuthenticatedUser, requireRole, isPortAdmin } from \"../lib/permissions\";\n\n/**\n * Create a container (admin only - containers are pre-seeded)\n */\nexport const create = mutation({\n  args: {\n    ownerId: v.string(),\n    containerNumber: v.string(),\n    containerType: containerTypeValidator,\n    dimensions: containerDimensionsValidator,\n    weightClass: containerWeightClassValidator,\n    operationType: containerOperationValidator,\n    isEmpty: v.boolean(),\n    readyDate: v.optional(v.number()),\n    departureDate: v.optional(v.number()),\n    notes: v.optional(v.string()),\n  },\n  returns: v.id(\"containers\"),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"port_admin\"]);\n\n    // Validate container number format (ISO 6346)\n    if (!isValidContainerNumber(args.containerNumber)) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: \"Numéro de conteneur invalide (format ISO 6346 requis)\",\n      });\n    }\n\n    // Check for duplicate\n    const existing = await ctx.db\n      .query(\"containers\")\n      .withIndex(\"by_container_number\", q => q.eq(\"containerNumber\", args.containerNumber))\n      .first();\n\n    if (existing) {\n      throw new ConvexError({\n        code: \"DUPLICATE\",\n        message: \"Ce numéro de conteneur existe déjà\",\n      });\n    }\n\n    const now = Date.now();\n    return await ctx.db.insert(\"containers\", {\n      ...args,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });\n  },\n});\n\n/**\n * Update container details (carrier can update their own)\n */\nexport const update = mutation({\n  args: {\n    containerId: v.id(\"containers\"),\n    isEmpty: v.optional(v.boolean()),\n    readyDate: v.optional(v.number()),\n    departureDate: v.optional(v.number()),\n    notes: v.optional(v.string()),\n  },\n  returns: v.null(),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    const container = await ctx.db.get(args.containerId);\n\n    if (!container) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Conteneur introuvable\" });\n    }\n\n    if (!isPortAdmin(user) && container.ownerId !== user.userId) {\n      throw new ConvexError({ code: \"FORBIDDEN\", message: \"Accès refusé\" });\n    }\n\n    // Cannot update if in an active booking\n    if (container.bookingId) {\n      const booking = await ctx.db.get(container.bookingId);\n      if (booking && (booking.status === \"pending\" || booking.status === \"confirmed\")) {\n        throw new ConvexError({\n          code: \"INVALID_STATE\",\n          message: \"Impossible de modifier un conteneur dans une réservation active\",\n        });\n      }\n    }\n\n    await ctx.db.patch(args.containerId, {\n      isEmpty: args.isEmpty ?? container.isEmpty,\n      readyDate: args.readyDate,\n      departureDate: args.departureDate,\n      notes: args.notes,\n      updatedAt: Date.now(),\n    });\n\n    return null;\n  },\n});\n\n// Helper: Validate ISO 6346 container number\nfunction isValidContainerNumber(num: string): boolean {\n  // Format: 4 letters (owner) + 6 digits + 1 check digit\n  // Example: MSCU1234567\n  const regex = /^[A-Z]{4}\\d{7}$/;\n  return regex.test(num);\n}\n```\n\n### 2.2 Terminal-Level Capacity Engine\n\n**File: `packages/backend/convex/lib/capacity.ts` (REPLACE)**\n\n```typescript\n/**\n * Terminal-Level Capacity Management\n * Handles atomic capacity reservation at the terminal level (not gate)\n */\nimport type { MutationCtx, QueryCtx } from \"../_generated/server\";\nimport type { Id, Doc } from \"../_generated/dataModel\";\n\nexport interface CapacityResult {\n  available: number;\n  total: number;\n  booked: number;\n  utilizationPercent: number;\n}\n\nexport interface SlotCapacity extends CapacityResult {\n  slotId: Id<\"timeSlots\">;\n  date: string;\n  startTime: string;\n  endTime: string;\n  autoValidationThreshold: number;\n  autoValidatedCount: number;\n  remainingAutoValidation: number;\n}\n\n/**\n * Get slot for terminal and time\n */\nexport async function getSlotForTerminal(\n  ctx: QueryCtx,\n  terminalId: Id<\"terminals\">,\n  date: string,\n  startTime: string\n): Promise<Doc<\"timeSlots\"> | null> {\n  return await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q => \n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .filter(q => q.eq(q.field(\"startTime\"), startTime))\n    .first();\n}\n\n/**\n * Check if a terminal slot has capacity and atomically reserve if available\n */\nexport async function checkAndReserveCapacity(\n  ctx: MutationCtx,\n  terminalId: Id<\"terminals\">,\n  date: string,\n  startTime: string,\n  endTime: string\n): Promise<{ success: boolean; slotId?: Id<\"timeSlots\">; error?: string }> {\n  // Find or create the slot\n  let slot = await getSlotForTerminal(ctx, terminalId, date, startTime);\n  \n  if (!slot) {\n    // Create slot on-demand with terminal defaults\n    const terminal = await ctx.db.get(terminalId);\n    if (!terminal) {\n      return { success: false, error: \"Terminal introuvable\" };\n    }\n\n    const now = Date.now();\n    const slotId = await ctx.db.insert(\"timeSlots\", {\n      terminalId,\n      date,\n      startTime,\n      endTime,\n      maxCapacity: terminal.defaultSlotCapacity,\n      currentBookings: 0,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n      createdBy: \"system\",\n    });\n\n    slot = await ctx.db.get(slotId);\n  }\n\n  if (!slot || !slot.isActive) {\n    return { success: false, error: \"Créneau horaire indisponible\" };\n  }\n\n  // Check capacity\n  if (slot.currentBookings >= slot.maxCapacity) {\n    return { success: false, error: \"Créneau complet\" };\n  }\n\n  // Atomically increment\n  await ctx.db.patch(slot._id, {\n    currentBookings: slot.currentBookings + 1,\n    updatedAt: Date.now(),\n  });\n\n  return { success: true, slotId: slot._id };\n}\n\n/**\n * Release capacity (on cancellation/rejection/expiration)\n */\nexport async function releaseCapacity(\n  ctx: MutationCtx,\n  slotId: Id<\"timeSlots\">\n): Promise<void> {\n  const slot = await ctx.db.get(slotId);\n  if (!slot) return;\n\n  await ctx.db.patch(slotId, {\n    currentBookings: Math.max(0, slot.currentBookings - 1),\n    updatedAt: Date.now(),\n  });\n}\n\n/**\n * Get terminal capacity for a specific date\n */\nexport async function getTerminalCapacityForDate(\n  ctx: QueryCtx,\n  terminalId: Id<\"terminals\">,\n  date: string\n): Promise<SlotCapacity[]> {\n  const terminal = await ctx.db.get(terminalId);\n  if (!terminal) return [];\n\n  const slots = await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q => \n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .collect();\n\n  const results: SlotCapacity[] = [];\n\n  for (const slot of slots) {\n    // Count auto-validated bookings for this slot\n    const bookings = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_terminal_and_date\", q =>\n        q.eq(\"terminalId\", terminalId).eq(\"preferredDate\", date)\n      )\n      .filter(q => \n        q.and(\n          q.eq(q.field(\"preferredTimeStart\"), slot.startTime),\n          q.or(\n            q.eq(q.field(\"status\"), \"pending\"),\n            q.eq(q.field(\"status\"), \"confirmed\")\n          )\n        )\n      )\n      .collect();\n\n    const autoValidatedCount = bookings.filter(b => b.wasAutoValidated).length;\n    const threshold = slot.autoValidationThreshold ?? terminal.autoValidationThreshold;\n    const maxAutoValidated = Math.floor((slot.maxCapacity * threshold) / 100);\n\n    results.push({\n      slotId: slot._id,\n      date: slot.date,\n      startTime: slot.startTime,\n      endTime: slot.endTime,\n      available: Math.max(0, slot.maxCapacity - slot.currentBookings),\n      total: slot.maxCapacity,\n      booked: slot.currentBookings,\n      utilizationPercent: Math.round((slot.currentBookings / slot.maxCapacity) * 100),\n      autoValidationThreshold: threshold,\n      autoValidatedCount,\n      remainingAutoValidation: Math.max(0, maxAutoValidated - autoValidatedCount),\n    });\n  }\n\n  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));\n}\n\n/**\n * Recalculate capacity for all slots of a terminal on a date\n */\nexport async function recalculateTerminalCapacity(\n  ctx: MutationCtx,\n  terminalId: Id<\"terminals\">,\n  date: string\n): Promise<void> {\n  const slots = await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q => \n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .collect();\n\n  for (const slot of slots) {\n    const bookings = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_terminal_and_date\", q =>\n        q.eq(\"terminalId\", terminalId).eq(\"preferredDate\", date)\n      )\n      .filter(q =>\n        q.and(\n          q.eq(q.field(\"preferredTimeStart\"), slot.startTime),\n          q.or(\n            q.eq(q.field(\"status\"), \"pending\"),\n            q.eq(q.field(\"status\"), \"confirmed\")\n          )\n        )\n      )\n      .collect();\n\n    await ctx.db.patch(slot._id, {\n      currentBookings: bookings.length,\n      updatedAt: Date.now(),\n    });\n  }\n}\n```\n\n### 2.3 Auto-Validation Engine\n\n**File: `packages/backend/convex/lib/autoValidation.ts` (CREATE)**\n\n```typescript\n/**\n * Auto-Validation Engine\n * Determines if a booking should be auto-approved based on slot utilization\n */\nimport type { QueryCtx, MutationCtx } from \"../_generated/server\";\nimport type { Id } from \"../_generated/dataModel\";\n\nexport interface AutoValidationResult {\n  shouldAutoValidate: boolean;\n  reason: string;\n  threshold: number;\n  currentAutoValidated: number;\n  maxAutoValidated: number;\n}\n\n/**\n * Check if a booking should be auto-validated\n */\nexport async function shouldAutoValidate(\n  ctx: QueryCtx,\n  terminalId: Id<\"terminals\">,\n  date: string,\n  startTime: string\n): Promise<AutoValidationResult> {\n  const terminal = await ctx.db.get(terminalId);\n  if (!terminal) {\n    return {\n      shouldAutoValidate: false,\n      reason: \"Terminal introuvable\",\n      threshold: 0,\n      currentAutoValidated: 0,\n      maxAutoValidated: 0,\n    };\n  }\n\n  // Find the slot\n  const slot = await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q =>\n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .filter(q => q.eq(q.field(\"startTime\"), startTime))\n    .first();\n\n  if (!slot) {\n    // No slot yet means first booking - auto-validate\n    const threshold = terminal.autoValidationThreshold;\n    const maxCapacity = terminal.defaultSlotCapacity;\n    const maxAutoValidated = Math.floor((maxCapacity * threshold) / 100);\n    \n    return {\n      shouldAutoValidate: maxAutoValidated > 0,\n      reason: maxAutoValidated > 0 \n        ? \"Premier créneaux - validation automatique\" \n        : \"Validation automatique désactivée\",\n      threshold,\n      currentAutoValidated: 0,\n      maxAutoValidated,\n    };\n  }\n\n  const threshold = slot.autoValidationThreshold ?? terminal.autoValidationThreshold;\n  const maxAutoValidated = Math.floor((slot.maxCapacity * threshold) / 100);\n\n  // Count current auto-validated bookings\n  const autoValidatedBookings = await ctx.db\n    .query(\"bookings\")\n    .withIndex(\"by_terminal_and_date\", q =>\n      q.eq(\"terminalId\", terminalId).eq(\"preferredDate\", date)\n    )\n    .filter(q =>\n      q.and(\n        q.eq(q.field(\"preferredTimeStart\"), startTime),\n        q.eq(q.field(\"wasAutoValidated\"), true),\n        q.or(\n          q.eq(q.field(\"status\"), \"confirmed\"),\n          q.eq(q.field(\"status\"), \"consumed\")\n        )\n      )\n    )\n    .collect();\n\n  const currentAutoValidated = autoValidatedBookings.length;\n\n  if (currentAutoValidated >= maxAutoValidated) {\n    return {\n      shouldAutoValidate: false,\n      reason: `Seuil atteint (${currentAutoValidated}/${maxAutoValidated})`,\n      threshold,\n      currentAutoValidated,\n      maxAutoValidated,\n    };\n  }\n\n  return {\n    shouldAutoValidate: true,\n    reason: `Validation automatique (${currentAutoValidated + 1}/${maxAutoValidated})`,\n    threshold,\n    currentAutoValidated,\n    maxAutoValidated,\n  };\n}\n```\n\n### 2.4 Gate Assignment at Approval\n\n**File: `packages/backend/convex/bookings/internal.ts` (UPDATE)**\n\nAdd the following functions:\n\n```typescript\n/**\n * Select best gate for a booking at approval time\n * Uses load balancing across compatible gates\n */\nexport const assignGateForBooking = internalMutation({\n  args: {\n    bookingId: v.id(\"bookings\"),\n  },\n  returns: v.union(\n    v.object({ success: v.literal(true), gateId: v.id(\"gates\") }),\n    v.object({ success: v.literal(false), error: v.string() })\n  ),\n  handler: async (ctx, args) => {\n    const booking = await ctx.db.get(args.bookingId);\n    if (!booking) {\n      return { success: false, error: \"Réservation introuvable\" };\n    }\n\n    // Get the truck to check compatibility\n    const truck = await ctx.db.get(booking.truckId);\n    if (!truck) {\n      return { success: false, error: \"Camion introuvable\" };\n    }\n\n    // Get all active gates for the terminal\n    const gates = await ctx.db\n      .query(\"gates\")\n      .withIndex(\"by_terminal_and_active\", q =>\n        q.eq(\"terminalId\", booking.terminalId).eq(\"isActive\", true)\n      )\n      .collect();\n\n    if (gates.length === 0) {\n      return { success: false, error: \"Aucune porte disponible\" };\n    }\n\n    // Filter compatible gates\n    const compatibleGates = gates.filter(gate =>\n      gate.allowedTruckTypes.includes(truck.truckType) &&\n      gate.allowedTruckClasses.includes(truck.truckClass)\n    );\n\n    if (compatibleGates.length === 0) {\n      return { \n        success: false, \n        error: `Aucune porte compatible avec ce type de camion (${truck.truckType}/${truck.truckClass})` \n      };\n    }\n\n    // Load balance: count confirmed bookings per gate for this time\n    const gateCounts: Map<string, number> = new Map();\n\n    for (const gate of compatibleGates) {\n      const bookingsAtGate = await ctx.db\n        .query(\"bookings\")\n        .withIndex(\"by_gate\", q => q.eq(\"gateId\", gate._id))\n        .filter(q =>\n          q.and(\n            q.eq(q.field(\"preferredDate\"), booking.preferredDate),\n            q.eq(q.field(\"preferredTimeStart\"), booking.preferredTimeStart),\n            q.or(\n              q.eq(q.field(\"status\"), \"confirmed\"),\n              q.eq(q.field(\"status\"), \"consumed\")\n            )\n          )\n        )\n        .collect();\n\n      gateCounts.set(gate._id, bookingsAtGate.length);\n    }\n\n    // Select gate with least bookings\n    let selectedGate = compatibleGates[0];\n    let minCount = gateCounts.get(selectedGate._id) ?? 0;\n\n    for (const gate of compatibleGates) {\n      const count = gateCounts.get(gate._id) ?? 0;\n      if (count < minCount) {\n        minCount = count;\n        selectedGate = gate;\n      }\n    }\n\n    return { success: true, gateId: selectedGate._id };\n  },\n});\n\n/**\n * Generate terminal-prefixed booking reference\n * Format: TER1-BK-XXXXXX (terminal code + 6 digits)\n */\nexport const generateBookingReference = internalMutation({\n  args: {\n    terminalId: v.id(\"terminals\"),\n  },\n  returns: v.string(),\n  handler: async (ctx, args) => {\n    const terminal = await ctx.db.get(args.terminalId);\n    if (!terminal) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Terminal introuvable\" });\n    }\n\n    // Get last booking for this terminal to determine sequence\n    const lastBooking = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_terminal\", q => q.eq(\"terminalId\", args.terminalId))\n      .order(\"desc\")\n      .first();\n\n    let sequence = 1;\n    if (lastBooking) {\n      const match = lastBooking.bookingReference.match(/-(\\d{6})$/);\n      if (match) {\n        sequence = parseInt(match[1], 10) + 1;\n      }\n    }\n\n    const paddedSequence = sequence.toString().padStart(6, \"0\");\n    return `${terminal.code}-BK-${paddedSequence}`;\n  },\n});\n```\n\n### 2.5 Refactored Booking Mutations\n\n**File: `packages/backend/convex/bookings/mutations.ts` (MAJOR REFACTOR)**\n\n```typescript\n/**\n * Create a new booking with multiple containers\n * Terminal-level capacity, auto-validation, gate assigned later\n */\nexport const create = mutation({\n  args: {\n    terminalId: v.id(\"terminals\"),\n    truckId: v.id(\"trucks\"),\n    containerIds: v.array(v.id(\"containers\")),\n    preferredDate: v.string(),                    // YYYY-MM-DD\n    preferredTimeStart: v.string(),               // HH:mm\n    preferredTimeEnd: v.string(),                 // HH:mm\n    driverName: v.optional(v.string()),\n    driverPhone: v.optional(v.string()),\n    driverIdNumber: v.optional(v.string()),\n  },\n  returns: v.object({\n    bookingId: v.id(\"bookings\"),\n    bookingReference: v.string(),\n    status: bookingStatusValidator,\n    wasAutoValidated: v.boolean(),\n    gateId: v.optional(v.id(\"gates\")),\n  }),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"carrier\"]);\n\n    // 1. Validate terminal\n    const terminal = await ctx.db.get(args.terminalId);\n    if (!terminal || !terminal.isActive) {\n      throw new ConvexError({\n        code: \"NOT_FOUND\",\n        message: \"Terminal introuvable ou inactif\",\n      });\n    }\n\n    // 2. Validate truck ownership\n    const truck = await ctx.db.get(args.truckId);\n    if (!truck || !truck.isActive) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Camion introuvable\" });\n    }\n    if (truck.ownerId !== user.userId) {\n      throw new ConvexError({ \n        code: \"FORBIDDEN\", \n        message: \"Ce camion ne vous appartient pas\" \n      });\n    }\n\n    // 3. Validate containers\n    const config = await getSystemConfig(ctx);\n    if (args.containerIds.length === 0) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: \"Au moins un conteneur est requis\",\n      });\n    }\n    if (args.containerIds.length > config.maxContainersPerBooking) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: `Maximum ${config.maxContainersPerBooking} conteneurs par réservation`,\n      });\n    }\n\n    // Validate each container\n    for (const containerId of args.containerIds) {\n      const container = await ctx.db.get(containerId);\n      if (!container || !container.isActive) {\n        throw new ConvexError({\n          code: \"NOT_FOUND\",\n          message: `Conteneur ${containerId} introuvable`,\n        });\n      }\n      if (container.ownerId !== user.userId) {\n        throw new ConvexError({\n          code: \"FORBIDDEN\",\n          message: `Le conteneur ${container.containerNumber} ne vous appartient pas`,\n        });\n      }\n      if (container.bookingId) {\n        throw new ConvexError({\n          code: \"INVALID_STATE\",\n          message: `Le conteneur ${container.containerNumber} est déjà dans une réservation`,\n        });\n      }\n    }\n\n    // 4. Validate booking window\n    const slotDateTime = new Date(`${args.preferredDate}T${args.preferredTimeStart}`);\n    const now = new Date();\n    const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);\n\n    if (slotDateTime <= now) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: \"Impossible de réserver un créneau dans le passé\",\n      });\n    }\n    if (hoursUntilSlot < config.minAdvanceBookingHours) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: `Réservation minimum ${config.minAdvanceBookingHours}h à l'avance`,\n      });\n    }\n    if (hoursUntilSlot / 24 > config.maxAdvanceBookingDays) {\n      throw new ConvexError({\n        code: \"INVALID_INPUT\",\n        message: `Réservation maximum ${config.maxAdvanceBookingDays} jours à l'avance`,\n      });\n    }\n\n    // 5. Check if truck already booked for this slot\n    const existingBooking = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_truck\", q => q.eq(\"truckId\", args.truckId))\n      .filter(q =>\n        q.and(\n          q.eq(q.field(\"preferredDate\"), args.preferredDate),\n          q.eq(q.field(\"preferredTimeStart\"), args.preferredTimeStart),\n          q.or(\n            q.eq(q.field(\"status\"), \"pending\"),\n            q.eq(q.field(\"status\"), \"confirmed\")\n          )\n        )\n      )\n      .first();\n\n    if (existingBooking) {\n      throw new ConvexError({\n        code: \"DUPLICATE\",\n        message: \"Ce camion a déjà une réservation pour ce créneau\",\n      });\n    }\n\n    // 6. Reserve capacity at terminal level\n    const capacityResult = await checkAndReserveCapacity(\n      ctx,\n      args.terminalId,\n      args.preferredDate,\n      args.preferredTimeStart,\n      args.preferredTimeEnd\n    );\n\n    if (!capacityResult.success) {\n      throw new ConvexError({\n        code: \"CAPACITY_FULL\",\n        message: capacityResult.error ?? \"Créneau complet\",\n      });\n    }\n\n    // 7. Check auto-validation\n    const autoValidation = await shouldAutoValidate(\n      ctx,\n      args.terminalId,\n      args.preferredDate,\n      args.preferredTimeStart\n    );\n\n    // 8. Generate booking reference\n    const bookingReference = await ctx.runMutation(\n      internal.bookings.internal.generateBookingReference,\n      { terminalId: args.terminalId }\n    );\n\n    // 9. Determine initial status and gate\n    let status: \"pending\" | \"confirmed\" = \"pending\";\n    let gateId: Id<\"gates\"> | undefined = undefined;\n    let confirmedAt: number | undefined = undefined;\n\n    if (autoValidation.shouldAutoValidate) {\n      // Auto-validate: assign gate immediately\n      const gateResult = await ctx.runMutation(\n        internal.bookings.internal.assignGateForBooking,\n        { bookingId: args.bookingId } // Note: We'll create booking first, then update\n      );\n\n      // For auto-validation, we need a two-step process\n      // First create pending, then update to confirmed with gate\n      status = \"confirmed\";\n      confirmedAt = Date.now();\n    }\n\n    // 10. Create booking\n    const nowTs = Date.now();\n    const bookingId = await ctx.db.insert(\"bookings\", {\n      terminalId: args.terminalId,\n      carrierId: user.userId,\n      truckId: args.truckId,\n      containerIds: args.containerIds,\n      bookingReference,\n      status: \"pending\", // Start as pending, update if auto-validated\n      wasAutoValidated: autoValidation.shouldAutoValidate,\n      preferredDate: args.preferredDate,\n      preferredTimeStart: args.preferredTimeStart,\n      preferredTimeEnd: args.preferredTimeEnd,\n      driverName: args.driverName?.trim(),\n      driverPhone: args.driverPhone?.trim(),\n      driverIdNumber: args.driverIdNumber?.trim(),\n      bookedAt: nowTs,\n      createdBy: user.userId,\n      updatedAt: nowTs,\n    });\n\n    // 11. Link containers to booking\n    for (const containerId of args.containerIds) {\n      await ctx.db.patch(containerId, {\n        bookingId,\n        updatedAt: nowTs,\n      });\n    }\n\n    // 12. If auto-validated, confirm and assign gate\n    if (autoValidation.shouldAutoValidate) {\n      const gateResult = await ctx.runMutation(\n        internal.bookings.internal.assignGateForBooking,\n        { bookingId }\n      );\n\n      if (gateResult.success) {\n        await ctx.db.patch(bookingId, {\n          status: \"confirmed\",\n          gateId: gateResult.gateId,\n          confirmedAt: nowTs,\n          processedBy: \"system\",\n          updatedAt: nowTs,\n        });\n\n        // Generate QR code\n        await ctx.scheduler.runAfter(0, internal.qr.generateQRCode, { bookingId });\n      }\n    }\n\n    // 13. Record history\n    await ctx.runMutation(internal.bookings.internal.recordHistory, {\n      bookingId,\n      changeType: \"created\",\n      newValue: JSON.stringify({\n        terminalId: args.terminalId,\n        truckId: args.truckId,\n        containerIds: args.containerIds,\n        status: autoValidation.shouldAutoValidate ? \"confirmed\" : \"pending\",\n        wasAutoValidated: autoValidation.shouldAutoValidate,\n      }),\n      changedBy: user.userId,\n      requiredRebook: false,\n    });\n\n    // 14. Send notification\n    await ctx.scheduler.runAfter(0, internal.notifications.internal.sendBookingNotification, {\n      bookingId,\n      type: autoValidation.shouldAutoValidate ? \"booking_confirmed\" : \"booking_created\",\n    });\n\n    const finalBooking = await ctx.db.get(bookingId);\n\n    return {\n      bookingId,\n      bookingReference,\n      status: finalBooking?.status ?? \"pending\",\n      wasAutoValidated: autoValidation.shouldAutoValidate,\n      gateId: finalBooking?.gateId,\n    };\n  },\n});\n\n/**\n * Confirm a pending booking (operator/admin)\n * Assigns gate at this point\n */\nexport const confirm = mutation({\n  args: {\n    bookingId: v.id(\"bookings\"),\n    gateId: v.optional(v.id(\"gates\")),            // Optional: operator can specify\n    note: v.optional(v.string()),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    gateId: v.optional(v.id(\"gates\")),\n    error: v.optional(v.string()),\n  }),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"port_admin\", \"terminal_operator\"]);\n\n    const booking = await ctx.db.get(args.bookingId);\n    if (!booking) {\n      return { success: false, error: \"Réservation introuvable\" };\n    }\n\n    // Permission check\n    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, \"confirmed\");\n    if (!canModify) {\n      return { success: false, error: \"Accès refusé\" };\n    }\n\n    if (booking.status !== \"pending\") {\n      return { \n        success: false, \n        error: `Impossible de confirmer une réservation avec le statut \"${booking.status}\"` \n      };\n    }\n\n    // Assign gate (use provided or auto-assign)\n    let gateId = args.gateId;\n    if (!gateId) {\n      const gateResult = await ctx.runMutation(\n        internal.bookings.internal.assignGateForBooking,\n        { bookingId: args.bookingId }\n      );\n\n      if (!gateResult.success) {\n        return { success: false, error: gateResult.error };\n      }\n      gateId = gateResult.gateId;\n    } else {\n      // Validate provided gate\n      const gate = await ctx.db.get(gateId);\n      if (!gate || !gate.isActive || gate.terminalId !== booking.terminalId) {\n        return { success: false, error: \"Porte invalide\" };\n      }\n    }\n\n    const now = Date.now();\n    await ctx.db.patch(args.bookingId, {\n      status: \"confirmed\",\n      gateId,\n      confirmedAt: now,\n      processedBy: user.userId,\n      updatedAt: now,\n    });\n\n    // Generate QR code\n    await ctx.scheduler.runAfter(0, internal.qr.generateQRCode, { \n      bookingId: args.bookingId \n    });\n\n    // Record history\n    await ctx.runMutation(internal.bookings.internal.recordHistory, {\n      bookingId: args.bookingId,\n      changeType: \"status_changed\",\n      previousValue: \"pending\",\n      newValue: \"confirmed\",\n      changedBy: user.userId,\n      note: args.note,\n      requiredRebook: false,\n    });\n\n    // Send notification\n    await ctx.scheduler.runAfter(0, internal.notifications.internal.sendBookingNotification, {\n      bookingId: args.bookingId,\n      type: \"booking_confirmed\",\n    });\n\n    return { success: true, gateId };\n  },\n});\n\n/**\n * Cancel a booking (carrier can cancel anytime, operators can cancel any)\n */\nexport const cancel = mutation({\n  args: {\n    bookingId: v.id(\"bookings\"),\n    reason: v.optional(v.string()),\n  },\n  returns: v.null(),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n\n    const booking = await ctx.db.get(args.bookingId);\n    if (!booking) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Réservation introuvable\" });\n    }\n\n    // Permission check\n    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, \"cancelled\");\n    if (!canModify) {\n      throw new ConvexError({ code: \"FORBIDDEN\", message: \"Accès refusé\" });\n    }\n\n    // Carriers can cancel anytime (no cancellation window restriction)\n    if (!isValidStatusTransition(booking.status, \"cancelled\")) {\n      throw new ConvexError({\n        code: \"INVALID_STATE\",\n        message: `Impossible d'annuler une réservation avec le statut \"${booking.status}\"`,\n      });\n    }\n\n    // Release capacity\n    const slot = await ctx.db\n      .query(\"timeSlots\")\n      .withIndex(\"by_terminal_and_date\", q =>\n        q.eq(\"terminalId\", booking.terminalId).eq(\"date\", booking.preferredDate)\n      )\n      .filter(q => q.eq(q.field(\"startTime\"), booking.preferredTimeStart))\n      .first();\n\n    if (slot) {\n      await releaseCapacity(ctx, slot._id);\n    }\n\n    // Unlink containers\n    for (const containerId of booking.containerIds) {\n      await ctx.db.patch(containerId, {\n        bookingId: undefined,\n        updatedAt: Date.now(),\n      });\n    }\n\n    const now = Date.now();\n    await ctx.db.patch(args.bookingId, {\n      status: \"cancelled\",\n      cancelledAt: now,\n      statusReason: args.reason?.trim(),\n      processedBy: user.userId,\n      updatedAt: now,\n    });\n\n    // Record history\n    await ctx.runMutation(internal.bookings.internal.recordHistory, {\n      bookingId: args.bookingId,\n      changeType: \"status_changed\",\n      previousValue: booking.status,\n      newValue: \"cancelled\",\n      changedBy: user.userId,\n      note: args.reason,\n      requiredRebook: false,\n    });\n\n    // Send notification\n    await ctx.scheduler.runAfter(0, internal.notifications.internal.sendBookingNotification, {\n      bookingId: args.bookingId,\n      type: \"booking_cancelled\",\n      additionalParams: { reason: args.reason },\n    });\n\n    return null;\n  },\n});\n\n/**\n * Change truck (only allowed modification, status preserved)\n */\nexport const changeTruck = mutation({\n  args: {\n    bookingId: v.id(\"bookings\"),\n    newTruckId: v.id(\"trucks\"),\n  },\n  returns: v.null(),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n\n    const booking = await ctx.db.get(args.bookingId);\n    if (!booking) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Réservation introuvable\" });\n    }\n\n    // Only carrier can change truck\n    if (booking.carrierId !== user.userId && !isPortAdmin(user)) {\n      throw new ConvexError({ code: \"FORBIDDEN\", message: \"Accès refusé\" });\n    }\n\n    if (booking.status !== \"pending\" && booking.status !== \"confirmed\") {\n      throw new ConvexError({\n        code: \"INVALID_STATE\",\n        message: `Impossible de changer le camion pour une réservation avec le statut \"${booking.status}\"`,\n      });\n    }\n\n    // Validate new truck\n    const newTruck = await ctx.db.get(args.newTruckId);\n    if (!newTruck || !newTruck.isActive) {\n      throw new ConvexError({ code: \"NOT_FOUND\", message: \"Camion introuvable\" });\n    }\n    if (newTruck.ownerId !== user.userId) {\n      throw new ConvexError({\n        code: \"FORBIDDEN\",\n        message: \"Ce camion ne vous appartient pas\",\n      });\n    }\n\n    // If already confirmed with gate, validate truck compatibility\n    if (booking.gateId) {\n      const gate = await ctx.db.get(booking.gateId);\n      if (gate) {\n        if (!gate.allowedTruckTypes.includes(newTruck.truckType)) {\n          throw new ConvexError({\n            code: \"INVALID_INPUT\",\n            message: `Le type de camion ${newTruck.truckType} n'est pas accepté à cette porte`,\n          });\n        }\n        if (!gate.allowedTruckClasses.includes(newTruck.truckClass)) {\n          throw new ConvexError({\n            code: \"INVALID_INPUT\",\n            message: `La classe de camion ${newTruck.truckClass} n'est pas acceptée à cette porte`,\n          });\n        }\n      }\n    }\n\n    // Check new truck doesn't have booking for same slot\n    const existingBooking = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_truck\", q => q.eq(\"truckId\", args.newTruckId))\n      .filter(q =>\n        q.and(\n          q.eq(q.field(\"preferredDate\"), booking.preferredDate),\n          q.eq(q.field(\"preferredTimeStart\"), booking.preferredTimeStart),\n          q.neq(q.field(\"_id\"), args.bookingId),\n          q.or(\n            q.eq(q.field(\"status\"), \"pending\"),\n            q.eq(q.field(\"status\"), \"confirmed\")\n          )\n        )\n      )\n      .first();\n\n    if (existingBooking) {\n      throw new ConvexError({\n        code: \"DUPLICATE\",\n        message: \"Ce camion a déjà une réservation pour ce créneau\",\n      });\n    }\n\n    const previousTruckId = booking.truckId;\n\n    await ctx.db.patch(args.bookingId, {\n      truckId: args.newTruckId,\n      updatedAt: Date.now(),\n    });\n\n    await ctx.runMutation(internal.bookings.internal.recordHistory, {\n      bookingId: args.bookingId,\n      changeType: \"truck_changed\",\n      previousValue: previousTruckId,\n      newValue: args.newTruckId,\n      changedBy: user.userId,\n      requiredRebook: false,\n    });\n\n    return null;\n  },\n});\n```\n\n---\n\n## Phase 3: AI Tools (French Only)\n\n### 3.1 Updated Agent Configuration\n\n**File: `packages/backend/convex/ai/agent.ts` (REPLACE)**\n\n```typescript\n\"use node\";\nimport { google } from \"@ai-sdk/google\";\nimport { Agent } from \"@convex-dev/agent\";\nimport { components } from \"../_generated/api\";\nimport { ALL_TOOLS } from \"./registry\";\n\nexport const apcsAgent = new Agent(components.agent, {\n  name: \"Assistant APCS\",\n  languageModel: google(\"gemini-2.0-flash\"),\n  instructions: `Tu es l'assistant APCS (Advanced Port Container System).\nTu aides les utilisateurs à gérer les opérations portuaires, les réservations de camions et la logistique.\n\nIMPORTANT: Tu réponds TOUJOURS en français, quelle que soit la langue de l'utilisateur.\n\nInformations clés:\n- Le système gère des terminaux portuaires avec des portes d'entrée\n- Les réservations sont faites au niveau du terminal, pas de la porte\n- Une réservation = 1 camion + plusieurs conteneurs (enlèvement ou dépôt)\n- Il y a trois rôles: port_admin, terminal_operator, carrier\n- Cycle de vie des réservations: en_attente → confirmée/refusée → consommée/annulée/expirée\n\nRègles:\n- Utilise TOUJOURS les outils disponibles pour récupérer des données réelles\n- Ne jamais inventer d'informations\n- Présente les données de manière claire et structurée\n- Si un outil retourne ACCESS_DENIED, explique que le rôle de l'utilisateur ne permet pas cette action\n- Sois concis mais complet\n- Pour les réservations, guide l'utilisateur étape par étape:\n  1. D'abord sélectionner les conteneurs\n  2. Ensuite choisir un créneau optimal\n  3. Puis sélectionner le camion\n  4. Enfin confirmer la réservation\n\nValidation automatique:\n- Les premières réservations d'un créneau peuvent être validées automatiquement\n- Si la réservation est auto-validée, informe l'utilisateur que sa réservation est confirmée immédiatement\n- Sinon, explique que la réservation est en attente de validation par l'opérateur`,\n  tools: ALL_TOOLS,\n  maxSteps: 10,\n});\n```\n\n### 3.2 New AI Tools for Containers\n\n**File: `packages/backend/convex/ai/tools/containers.ts` (CREATE)**\n\n```typescript\nimport { tool } from \"@convex-dev/agent\";\nimport { v } from \"convex/values\";\nimport { internal } from \"../../_generated/api\";\nimport { checkToolAccess } from \"./types\";\n\n/**\n * List carrier's containers\n */\nexport const listMyContainers = tool({\n  description: \"Liste les conteneurs du transporteur avec filtres optionnels\",\n  args: {\n    operationType: v.optional(v.union(v.literal(\"pick_up\"), v.literal(\"drop_off\"))),\n    includeBooked: v.optional(v.boolean()),\n  },\n  returns: v.object({\n    containers: v.array(v.object({\n      id: v.string(),\n      containerNumber: v.string(),\n      type: v.string(),\n      dimensions: v.string(),\n      operationType: v.string(),\n      isEmpty: v.boolean(),\n      isBooked: v.boolean(),\n    })),\n    total: v.number(),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"listMyContainers\");\n    if (!accessCheck.allowed) {\n      return { containers: [], total: 0 };\n    }\n\n    const containers = await ctx.runQuery(internal.ai.internalQueries.listMyContainers, {\n      operationType: args.operationType,\n      includeBooked: args.includeBooked ?? false,\n    });\n\n    return {\n      containers: containers.map(c => ({\n        id: c._id,\n        containerNumber: c.containerNumber,\n        type: c.containerType,\n        dimensions: c.dimensions,\n        operationType: c.operationType,\n        isEmpty: c.isEmpty,\n        isBooked: !!c.bookingId,\n      })),\n      total: containers.length,\n    };\n  },\n});\n\n/**\n * Interactive container selector for booking\n */\nexport const selectContainersForBooking = tool({\n  description: \"Affiche un sélecteur interactif de conteneurs pour la réservation\",\n  args: {\n    operationType: v.optional(v.union(v.literal(\"pick_up\"), v.literal(\"drop_off\"))),\n  },\n  returns: v.object({\n    uiComponent: v.string(),\n    availableContainers: v.array(v.object({\n      id: v.string(),\n      containerNumber: v.string(),\n      type: v.string(),\n      dimensions: v.string(),\n      operationType: v.string(),\n    })),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"selectContainersForBooking\");\n    if (!accessCheck.allowed) {\n      return { uiComponent: \"access_denied\", availableContainers: [] };\n    }\n\n    const containers = await ctx.runQuery(internal.ai.internalQueries.listMyContainers, {\n      operationType: args.operationType,\n      includeBooked: false,\n    });\n\n    return {\n      uiComponent: \"container-selector\",\n      availableContainers: containers.map(c => ({\n        id: c._id,\n        containerNumber: c.containerNumber,\n        type: c.containerType,\n        dimensions: c.dimensions,\n        operationType: c.operationType,\n      })),\n    };\n  },\n});\n```\n\n### 3.3 New AI Tools for Slots\n\n**File: `packages/backend/convex/ai/tools/slots.ts` (CREATE)**\n\n```typescript\nimport { tool } from \"@convex-dev/agent\";\nimport { v } from \"convex/values\";\nimport { internal } from \"../../_generated/api\";\nimport { checkToolAccess } from \"./types\";\n\n/**\n * Get slot availability with capacity info\n */\nexport const getSlotAvailability = tool({\n  description: \"Récupère la disponibilité des créneaux pour un terminal et une date\",\n  args: {\n    terminalId: v.string(),\n    date: v.string(),                             // YYYY-MM-DD\n  },\n  returns: v.object({\n    uiComponent: v.string(),\n    slots: v.array(v.object({\n      startTime: v.string(),\n      endTime: v.string(),\n      available: v.number(),\n      total: v.number(),\n      utilizationPercent: v.number(),\n      canAutoValidate: v.boolean(),\n    })),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"getSlotAvailability\");\n    if (!accessCheck.allowed) {\n      return { uiComponent: \"access_denied\", slots: [] };\n    }\n\n    const slots = await ctx.runQuery(internal.ai.internalQueries.getSlotAvailability, {\n      terminalId: args.terminalId,\n      date: args.date,\n    });\n\n    return {\n      uiComponent: \"slot-calendar\",\n      slots: slots.map(s => ({\n        startTime: s.startTime,\n        endTime: s.endTime,\n        available: s.available,\n        total: s.total,\n        utilizationPercent: s.utilizationPercent,\n        canAutoValidate: s.remainingAutoValidation > 0,\n      })),\n    };\n  },\n});\n\n/**\n * Suggest optimal slots based on load balancing and urgency\n */\nexport const suggestOptimalSlots = tool({\n  description: \"Suggère les meilleurs créneaux en fonction de la charge et des conteneurs sélectionnés\",\n  args: {\n    terminalId: v.string(),\n    containerIds: v.array(v.string()),\n    preferredDate: v.optional(v.string()),\n  },\n  returns: v.object({\n    uiComponent: v.string(),\n    suggestions: v.array(v.object({\n      date: v.string(),\n      startTime: v.string(),\n      endTime: v.string(),\n      score: v.number(),                          // 0-100 recommendation score\n      reason: v.string(),\n      canAutoValidate: v.boolean(),\n    })),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"suggestOptimalSlots\");\n    if (!accessCheck.allowed) {\n      return { uiComponent: \"access_denied\", suggestions: [] };\n    }\n\n    const suggestions = await ctx.runQuery(internal.ai.internalQueries.suggestOptimalSlots, {\n      terminalId: args.terminalId,\n      containerIds: args.containerIds,\n      preferredDate: args.preferredDate,\n    });\n\n    return {\n      uiComponent: \"slot-suggestions\",\n      suggestions: suggestions.map(s => ({\n        date: s.date,\n        startTime: s.startTime,\n        endTime: s.endTime,\n        score: s.score,\n        reason: s.reason,\n        canAutoValidate: s.canAutoValidate,\n      })),\n    };\n  },\n});\n```\n\n### 3.4 New AI Tools for Booking Flow\n\n**File: `packages/backend/convex/ai/tools/booking-flow.ts` (CREATE)**\n\n```typescript\nimport { tool } from \"@convex-dev/agent\";\nimport { v } from \"convex/values\";\nimport { internal } from \"../../_generated/api\";\nimport { checkToolAccess } from \"./types\";\n\n/**\n * Create booking via AI\n */\nexport const createBookingViaAI = tool({\n  description: \"Crée une réservation avec les conteneurs et le créneau sélectionnés\",\n  args: {\n    terminalId: v.string(),\n    truckId: v.string(),\n    containerIds: v.array(v.string()),\n    preferredDate: v.string(),\n    preferredTimeStart: v.string(),\n    preferredTimeEnd: v.string(),\n    driverName: v.optional(v.string()),\n    driverPhone: v.optional(v.string()),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    uiComponent: v.string(),\n    booking: v.optional(v.object({\n      bookingId: v.string(),\n      bookingReference: v.string(),\n      status: v.string(),\n      wasAutoValidated: v.boolean(),\n      gateName: v.optional(v.string()),\n    })),\n    error: v.optional(v.string()),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"createBookingViaAI\");\n    if (!accessCheck.allowed) {\n      return { \n        success: false, \n        uiComponent: \"access_denied\",\n        error: \"Accès refusé\" \n      };\n    }\n\n    try {\n      const result = await ctx.runMutation(internal.ai.mutations.createBooking, {\n        terminalId: args.terminalId,\n        truckId: args.truckId,\n        containerIds: args.containerIds,\n        preferredDate: args.preferredDate,\n        preferredTimeStart: args.preferredTimeStart,\n        preferredTimeEnd: args.preferredTimeEnd,\n        driverName: args.driverName,\n        driverPhone: args.driverPhone,\n      });\n\n      return {\n        success: true,\n        uiComponent: \"booking-confirmation-card\",\n        booking: {\n          bookingId: result.bookingId,\n          bookingReference: result.bookingReference,\n          status: result.status,\n          wasAutoValidated: result.wasAutoValidated,\n          gateName: result.gateName,\n        },\n      };\n    } catch (error: any) {\n      return {\n        success: false,\n        uiComponent: \"error\",\n        error: error.message || \"Erreur lors de la création de la réservation\",\n      };\n    }\n  },\n});\n\n/**\n * Cancel booking via AI\n */\nexport const cancelBookingViaAI = tool({\n  description: \"Annule une réservation existante\",\n  args: {\n    bookingId: v.string(),\n    reason: v.optional(v.string()),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    message: v.string(),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"cancelBookingViaAI\");\n    if (!accessCheck.allowed) {\n      return { success: false, message: \"Accès refusé\" };\n    }\n\n    try {\n      await ctx.runMutation(internal.ai.mutations.cancelBooking, {\n        bookingId: args.bookingId,\n        reason: args.reason,\n      });\n\n      return {\n        success: true,\n        message: \"Réservation annulée avec succès\",\n      };\n    } catch (error: any) {\n      return {\n        success: false,\n        message: error.message || \"Erreur lors de l'annulation\",\n      };\n    }\n  },\n});\n\n/**\n * Change truck for booking via AI\n */\nexport const changeTruckViaAI = tool({\n  description: \"Change le camion assigné à une réservation\",\n  args: {\n    bookingId: v.string(),\n    newTruckId: v.string(),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    message: v.string(),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"changeTruckViaAI\");\n    if (!accessCheck.allowed) {\n      return { success: false, message: \"Accès refusé\" };\n    }\n\n    try {\n      await ctx.runMutation(internal.ai.mutations.changeTruck, {\n        bookingId: args.bookingId,\n        newTruckId: args.newTruckId,\n      });\n\n      return {\n        success: true,\n        message: \"Camion changé avec succès\",\n      };\n    } catch (error: any) {\n      return {\n        success: false,\n        message: error.message || \"Erreur lors du changement de camion\",\n      };\n    }\n  },\n});\n```\n\n### 3.5 New AI Tools for Trucks\n\n**File: `packages/backend/convex/ai/tools/trucks.ts` (CREATE)**\n\n```typescript\nimport { tool } from \"@convex-dev/agent\";\nimport { v } from \"convex/values\";\nimport { internal } from \"../../_generated/api\";\nimport { checkToolAccess } from \"./types\";\n\n/**\n * List carrier's trucks\n */\nexport const listMyTrucks = tool({\n  description: \"Liste les camions du transporteur\",\n  args: {},\n  returns: v.object({\n    trucks: v.array(v.object({\n      id: v.string(),\n      licensePlate: v.string(),\n      truckType: v.string(),\n      truckClass: v.string(),\n      make: v.optional(v.string()),\n      model: v.optional(v.string()),\n    })),\n    total: v.number(),\n  }),\n  handler: async (ctx, args) => {\n    const accessCheck = await checkToolAccess(ctx, \"listMyTrucks\");\n    if (!accessCheck.allowed) {\n      return { trucks: [], total: 0 };\n    }\n\n    const trucks = await ctx.runQuery(internal.ai.internalQueries.listMyTrucks, {});\n\n    return {\n      trucks: trucks.map(t => ({\n        id: t._id,\n        licensePlate: t.licensePlate,\n        truckType: t.truckType,\n        truckClass: t.truckClass,\n        make: t.make,\n        model: t.model,\n      })),\n      total: trucks.length,\n    };\n  },\n});\n```\n\n### 3.6 Updated Tool Permissions\n\n**File: `packages/backend/convex/ai/tools/types.ts` (UPDATE)**\n\n```typescript\nexport const TOOL_PERMISSIONS: Record<string, ApcsRole[]> = {\n  // Existing tools\n  listMyBookings: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  getBookingDetails: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  listBookingsByTerminal: [\"terminal_operator\", \"port_admin\"],\n  listBookingsByCarrier: [\"port_admin\"],\n  listPendingBookings: [\"terminal_operator\", \"port_admin\"],\n  listTerminals: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  getTerminalDetails: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  getAvailableSlots: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  getSystemConfig: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n\n  // NEW: Container tools\n  listMyContainers: [\"carrier\"],\n  selectContainersForBooking: [\"carrier\"],\n\n  // NEW: Slot tools\n  getSlotAvailability: [\"carrier\", \"terminal_operator\", \"port_admin\"],\n  suggestOptimalSlots: [\"carrier\"],\n\n  // NEW: Booking flow tools\n  createBookingViaAI: [\"carrier\"],\n  cancelBookingViaAI: [\"carrier\"],\n  changeTruckViaAI: [\"carrier\"],\n\n  // NEW: Truck tools\n  listMyTrucks: [\"carrier\"],\n};\n```\n\n### 3.7 Updated Registry\n\n**File: `packages/backend/convex/ai/registry.ts` (UPDATE)**\n\n```typescript\n// Add new imports\nimport { listMyContainers, selectContainersForBooking } from \"./tools/containers\";\nimport { getSlotAvailability, suggestOptimalSlots } from \"./tools/slots\";\nimport { createBookingViaAI, cancelBookingViaAI, changeTruckViaAI } from \"./tools/booking-flow\";\nimport { listMyTrucks } from \"./tools/trucks\";\n\nexport const ALL_TOOLS = {\n  // Existing\n  listMyBookings,\n  getBookingDetails,\n  listBookingsByTerminal,\n  listBookingsByCarrier,\n  listPendingBookings,\n  listTerminals,\n  getTerminalDetails,\n  getAvailableSlots,\n  getSystemConfig,\n\n  // NEW: Containers\n  listMyContainers,\n  selectContainersForBooking,\n\n  // NEW: Slots\n  getSlotAvailability,\n  suggestOptimalSlots,\n\n  // NEW: Booking flow\n  createBookingViaAI,\n  cancelBookingViaAI,\n  changeTruckViaAI,\n\n  // NEW: Trucks\n  listMyTrucks,\n} as const;\n```\n\n---\n\n## Phase 4: QR Code System\n\n**File: `packages/backend/convex/qr/index.ts` (CREATE)**\n\n```typescript\n\"use node\";\nimport { internalAction, internalMutation } from \"../_generated/server\";\nimport { v } from \"convex/values\";\nimport QRCode from \"qrcode\";\n\n/**\n * Generate QR code for a booking\n */\nexport const generateQRCode = internalAction({\n  args: {\n    bookingId: v.id(\"bookings\"),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    qrCode: v.optional(v.string()),\n    storageId: v.optional(v.id(\"_storage\")),\n  }),\n  handler: async (ctx, args) => {\n    const booking = await ctx.runQuery(internal.bookings.queries.get, {\n      bookingId: args.bookingId,\n    });\n\n    if (!booking) {\n      return { success: false };\n    }\n\n    // Generate QR code data URL\n    const qrData = JSON.stringify({\n      type: \"APCS_BOOKING\",\n      ref: booking.bookingReference,\n    });\n\n    try {\n      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {\n        width: 300,\n        margin: 2,\n        color: {\n          dark: \"#000000\",\n          light: \"#FFFFFF\",\n        },\n      });\n\n      // Also generate as buffer for file storage\n      const qrCodeBuffer = await QRCode.toBuffer(qrData, {\n        width: 300,\n        margin: 2,\n      });\n\n      // Store in Convex file storage\n      const blob = new Blob([qrCodeBuffer], { type: \"image/png\" });\n      const storageId = await ctx.storage.store(blob);\n\n      // Update booking with QR code\n      await ctx.runMutation(internal.qr.updateBookingQR, {\n        bookingId: args.bookingId,\n        qrCode: qrCodeDataUrl,\n        qrCodeStorageId: storageId,\n      });\n\n      return {\n        success: true,\n        qrCode: qrCodeDataUrl,\n        storageId,\n      };\n    } catch (error) {\n      console.error(\"QR code generation failed:\", error);\n      return { success: false };\n    }\n  },\n});\n\nexport const updateBookingQR = internalMutation({\n  args: {\n    bookingId: v.id(\"bookings\"),\n    qrCode: v.string(),\n    qrCodeStorageId: v.id(\"_storage\"),\n  },\n  returns: v.null(),\n  handler: async (ctx, args) => {\n    await ctx.db.patch(args.bookingId, {\n      qrCode: args.qrCode,\n      qrCodeStorageId: args.qrCodeStorageId,\n      updatedAt: Date.now(),\n    });\n    return null;\n  },\n});\n```\n\n**File: `packages/backend/convex/qr/scan.ts` (CREATE)**\n\n```typescript\nimport { mutation } from \"../_generated/server\";\nimport { v, ConvexError } from \"convex/values\";\nimport { getAuthenticatedUser, requireRole, canManageTerminal } from \"../lib/permissions\";\nimport { internal } from \"../_generated/api\";\n\n/**\n * Scan types\n */\nexport const scanTypeValidator = v.union(\n  v.literal(\"entry\"),\n  v.literal(\"exit\")\n);\n\n/**\n * Process QR code scan (entry or exit)\n */\nexport const processScan = mutation({\n  args: {\n    bookingReference: v.string(),\n    scanType: scanTypeValidator,\n    gateId: v.id(\"gates\"),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    message: v.string(),\n    booking: v.optional(v.object({\n      bookingReference: v.string(),\n      truckLicensePlate: v.string(),\n      driverName: v.optional(v.string()),\n      containerCount: v.number(),\n      status: v.string(),\n    })),\n  }),\n  handler: async (ctx, args) => {\n    const user = await getAuthenticatedUser(ctx);\n    requireRole(user, [\"terminal_operator\", \"port_admin\"]);\n\n    // Find booking by reference\n    const booking = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_reference\", q => q.eq(\"bookingReference\", args.bookingReference))\n      .first();\n\n    if (!booking) {\n      return {\n        success: false,\n        message: `Réservation ${args.bookingReference} introuvable`,\n      };\n    }\n\n    // Verify gate belongs to booking's terminal\n    const gate = await ctx.db.get(args.gateId);\n    if (!gate || gate.terminalId !== booking.terminalId) {\n      return {\n        success: false,\n        message: \"Cette porte n'appartient pas au terminal de la réservation\",\n      };\n    }\n\n    // Verify operator has access to terminal\n    const hasAccess = await canManageTerminal(ctx, user, booking.terminalId);\n    if (!hasAccess) {\n      return {\n        success: false,\n        message: \"Vous n'avez pas accès à ce terminal\",\n      };\n    }\n\n    // Get truck info\n    const truck = await ctx.db.get(booking.truckId);\n\n    // Process based on scan type\n    if (args.scanType === \"entry\") {\n      // Entry scan\n      if (booking.status !== \"confirmed\") {\n        return {\n          success: false,\n          message: `Impossible de scanner l'entrée - statut actuel: ${booking.status}`,\n        };\n      }\n\n      if (booking.entryScannedAt) {\n        return {\n          success: false,\n          message: \"Cette réservation a déjà été scannée à l'entrée\",\n        };\n      }\n\n      const now = Date.now();\n      await ctx.db.patch(booking._id, {\n        status: \"consumed\",\n        consumedAt: now,\n        entryScannedAt: now,\n        scannedByEntry: user.userId,\n        gateId: args.gateId, // Update gate to actual entry gate\n        updatedAt: now,\n      });\n\n      // Record history\n      await ctx.runMutation(internal.bookings.internal.recordHistory, {\n        bookingId: booking._id,\n        changeType: \"status_changed\",\n        previousValue: \"confirmed\",\n        newValue: \"consumed\",\n        changedBy: user.userId,\n        note: `Entrée scannée à la porte ${gate.name}`,\n        requiredRebook: false,\n      });\n\n      return {\n        success: true,\n        message: `Entrée validée - Bienvenue au terminal`,\n        booking: {\n          bookingReference: booking.bookingReference,\n          truckLicensePlate: truck?.licensePlate ?? \"Inconnu\",\n          driverName: booking.driverName,\n          containerCount: booking.containerIds.length,\n          status: \"consumed\",\n        },\n      };\n    } else {\n      // Exit scan\n      if (booking.status !== \"consumed\") {\n        return {\n          success: false,\n          message: `Impossible de scanner la sortie - statut actuel: ${booking.status}`,\n        };\n      }\n\n      if (!booking.entryScannedAt) {\n        return {\n          success: false,\n          message: \"Aucun scan d'entrée enregistré pour cette réservation\",\n        };\n      }\n\n      if (booking.exitScannedAt) {\n        return {\n          success: false,\n          message: \"Cette réservation a déjà été scannée à la sortie\",\n        };\n      }\n\n      const now = Date.now();\n      await ctx.db.patch(booking._id, {\n        exitScannedAt: now,\n        scannedByExit: user.userId,\n        updatedAt: now,\n      });\n\n      // Calculate time in terminal\n      const timeInTerminalMs = now - booking.entryScannedAt;\n      const timeInTerminalMinutes = Math.round(timeInTerminalMs / 60000);\n\n      return {\n        success: true,\n        message: `Sortie validée - Temps dans le terminal: ${timeInTerminalMinutes} minutes`,\n        booking: {\n          bookingReference: booking.bookingReference,\n          truckLicensePlate: truck?.licensePlate ?? \"Inconnu\",\n          driverName: booking.driverName,\n          containerCount: booking.containerIds.length,\n          status: \"consumed\",\n        },\n      };\n    }\n  },\n});\n```\n\n---\n\n## Phase 5: Notification System with Email\n\n**File: `packages/backend/convex/email/index.ts` (CREATE)**\n\n```typescript\n\"use node\";\nimport { internalAction } from \"../_generated/server\";\nimport { v } from \"convex/values\";\nimport { Resend } from \"resend\";\n\nconst resend = new Resend(process.env.RESEND_API_KEY);\n\n/**\n * Send email notification\n */\nexport const sendEmail = internalAction({\n  args: {\n    to: v.string(),\n    subject: v.string(),\n    html: v.string(),\n  },\n  returns: v.object({\n    success: v.boolean(),\n    messageId: v.optional(v.string()),\n    error: v.optional(v.string()),\n  }),\n  handler: async (ctx, args) => {\n    try {\n      const result = await resend.emails.send({\n        from: \"APCS <noreply@apcs.port>\",\n        to: args.to,\n        subject: args.subject,\n        html: args.html,\n      });\n\n      return {\n        success: true,\n        messageId: result.data?.id,\n      };\n    } catch (error: any) {\n      console.error(\"Email send failed:\", error);\n      return {\n        success: false,\n        error: error.message,\n      };\n    }\n  },\n});\n\n/**\n * French email templates\n */\nexport const EMAIL_TEMPLATES = {\n  booking_created: (params: {\n    reference: string;\n    terminal: string;\n    date: string;\n    time: string;\n  }) => ({\n    subject: `Réservation ${params.reference} créée`,\n    html: `\n      <h1>Réservation créée</h1>\n      <p>Votre réservation <strong>${params.reference}</strong> a été créée.</p>\n      <ul>\n        <li><strong>Terminal:</strong> ${params.terminal}</li>\n        <li><strong>Date:</strong> ${params.date}</li>\n        <li><strong>Heure:</strong> ${params.time}</li>\n      </ul>\n      <p>Elle est en attente de confirmation par l'opérateur.</p>\n    `,\n  }),\n\n  booking_confirmed: (params: {\n    reference: string;\n    terminal: string;\n    gate: string;\n    date: string;\n    time: string;\n    qrCodeUrl?: string;\n  }) => ({\n    subject: `Réservation ${params.reference} confirmée`,\n    html: `\n      <h1>Réservation confirmée</h1>\n      <p>Votre réservation <strong>${params.reference}</strong> a été confirmée.</p>\n      <ul>\n        <li><strong>Terminal:</strong> ${params.terminal}</li>\n        <li><strong>Porte:</strong> ${params.gate}</li>\n        <li><strong>Date:</strong> ${params.date}</li>\n        <li><strong>Heure:</strong> ${params.time}</li>\n      </ul>\n      ${params.qrCodeUrl ? `<p>Présentez ce QR code à l'entrée:</p><img src=\"${params.qrCodeUrl}\" alt=\"QR Code\" />` : \"\"}\n    `,\n  }),\n\n  booking_rejected: (params: {\n    reference: string;\n    reason: string;\n  }) => ({\n    subject: `Réservation ${params.reference} refusée`,\n    html: `\n      <h1>Réservation refusée</h1>\n      <p>Votre réservation <strong>${params.reference}</strong> a été refusée.</p>\n      <p><strong>Raison:</strong> ${params.reason}</p>\n      <p>Veuillez créer une nouvelle réservation avec les corrections nécessaires.</p>\n    `,\n  }),\n\n  booking_reminder: (params: {\n    reference: string;\n    terminal: string;\n    gate: string;\n    hoursUntil: number;\n  }) => ({\n    subject: `Rappel: Réservation ${params.reference} dans ${params.hoursUntil}h`,\n    html: `\n      <h1>Rappel de réservation</h1>\n      <p>Votre réservation <strong>${params.reference}</strong> est prévue dans <strong>${params.hoursUntil} heures</strong>.</p>\n      <ul>\n        <li><strong>Terminal:</strong> ${params.terminal}</li>\n        <li><strong>Porte:</strong> ${params.gate}</li>\n      </ul>\n      <p>N'oubliez pas votre QR code!</p>\n    `,\n  }),\n\n  capacity_alert: (params: {\n    terminal: string;\n    date: string;\n    utilizationPercent: number;\n  }) => ({\n    subject: `Alerte capacité: ${params.terminal} à ${params.utilizationPercent}%`,\n    html: `\n      <h1>Alerte de capacité</h1>\n      <p>Le terminal <strong>${params.terminal}</strong> atteint <strong>${params.utilizationPercent}%</strong> de sa capacité pour le ${params.date}.</p>\n      <p>Veuillez surveiller les réservations et ajuster la capacité si nécessaire.</p>\n    `,\n  }),\n};\n```\n\n---\n\n## Phase 6: Cron Jobs\n\n**File: `packages/backend/convex/crons.ts` (UPDATE)**\n\n```typescript\nimport { cronJobs } from \"convex/server\";\nimport { internal } from \"./_generated/api\";\n\nconst crons = cronJobs();\n\n// ============================================================================\n// BOOKING EXPIRATION (with grace period)\n// ============================================================================\n\ncrons.interval(\n  \"expire old bookings with grace period\",\n  { minutes: 15 },\n  internal.scheduled.expireBookingsWithGrace,\n  {}\n);\n\n// ============================================================================\n// BOOKING REMINDERS\n// ============================================================================\n\ncrons.interval(\n  \"send 24h booking reminders\",\n  { hours: 1 },\n  internal.scheduled.sendBookingReminders,\n  { hoursBeforeSlot: 24 }\n);\n\ncrons.interval(\n  \"send 2h booking reminders\",\n  { minutes: 30 },\n  internal.scheduled.sendBookingReminders,\n  { hoursBeforeSlot: 2 }\n);\n\n// ============================================================================\n// CAPACITY ALERTS\n// ============================================================================\n\ncrons.cron(\n  \"check capacity alerts\",\n  \"0 6,12,18 * * *\",  // 6am, 12pm, 6pm\n  internal.scheduled.checkCapacityAlerts,\n  {}\n);\n\n// ============================================================================\n// ANALYTICS AGGREGATION\n// ============================================================================\n\ncrons.cron(\n  \"hourly analytics aggregation\",\n  \"0 * * * *\",  // Every hour\n  internal.scheduled.computeHourlyAggregates,\n  {}\n);\n\ncrons.cron(\n  \"daily analytics rollup\",\n  \"0 1 * * *\",  // 1am daily\n  internal.scheduled.computeDailyAggregates,\n  {}\n);\n\n// ============================================================================\n// CLEANUP\n// ============================================================================\n\ncrons.cron(\n  \"cleanup old notifications\",\n  \"0 2 * * *\",\n  internal.scheduled.cleanupOldNotifications,\n  { daysToKeep: 30 }\n);\n\ncrons.cron(\n  \"cleanup old audit logs\",\n  \"0 3 * * 0\",  // Sunday 3am\n  internal.scheduled.cleanupOldAuditLogs,\n  { daysToKeep: 90 }\n);\n\ncrons.cron(\n  \"recalculate slot capacity\",\n  \"0 4 * * *\",\n  internal.scheduled.recalculateAllCapacity,\n  {}\n);\n\nexport default crons;\n```\n\n---\n\n## Phase 7: Audit Logging\n\n**File: `packages/backend/convex/lib/auditLog.ts` (CREATE)**\n\n```typescript\nimport type { MutationCtx } from \"../_generated/server\";\nimport type { AuditAction } from \"./validators\";\n\ninterface AuditLogParams {\n  userId?: string;\n  action: AuditAction;\n  resource: string;\n  resourceId?: string;\n  args?: Record<string, unknown>;\n  result?: string;\n  errorMessage?: string;\n  ipAddress?: string;\n  userAgent?: string;\n  sessionId?: string;\n  aiThreadId?: string;\n  aiToolName?: string;\n  durationMs?: number;\n}\n\n// Fields to redact from audit logs\nconst SENSITIVE_FIELDS = [\n  \"password\",\n  \"token\",\n  \"secret\",\n  \"apiKey\",\n  \"api_key\",\n  \"authorization\",\n  \"credit_card\",\n  \"ssn\",\n];\n\n/**\n * Sanitize args by redacting sensitive fields\n */\nfunction sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {\n  const sanitized: Record<string, unknown> = {};\n\n  for (const [key, value] of Object.entries(args)) {\n    const keyLower = key.toLowerCase();\n    if (SENSITIVE_FIELDS.some(f => keyLower.includes(f))) {\n      sanitized[key] = \"[REDACTED]\";\n    } else if (typeof value === \"object\" && value !== null) {\n      sanitized[key] = sanitizeArgs(value as Record<string, unknown>);\n    } else {\n      sanitized[key] = value;\n    }\n  }\n\n  return sanitized;\n}\n\n/**\n * Log an audit entry\n */\nexport async function logAudit(\n  ctx: MutationCtx,\n  params: AuditLogParams\n): Promise<void> {\n  await ctx.db.insert(\"auditLogs\", {\n    userId: params.userId,\n    action: params.action,\n    resource: params.resource,\n    resourceId: params.resourceId,\n    args: params.args ? JSON.stringify(sanitizeArgs(params.args)) : undefined,\n    result: params.result,\n    errorMessage: params.errorMessage,\n    ipAddress: params.ipAddress,\n    userAgent: params.userAgent,\n    sessionId: params.sessionId,\n    aiThreadId: params.aiThreadId,\n    aiToolName: params.aiToolName,\n    timestamp: Date.now(),\n    durationMs: params.durationMs,\n  });\n}\n```\n\n**File: `packages/backend/convex/lib/withAudit.ts` (CREATE)**\n\n```typescript\nimport type { MutationCtx } from \"../_generated/server\";\nimport { logAudit } from \"./auditLog\";\n\n/**\n * Wrapper to add audit logging to mutations\n */\nexport function withAudit<TArgs, TResult>(\n  resource: string,\n  handler: (ctx: MutationCtx, args: TArgs) => Promise<TResult>\n) {\n  return async (ctx: MutationCtx, args: TArgs): Promise<TResult> => {\n    const startTime = Date.now();\n    let result: string = \"success\";\n    let errorMessage: string | undefined;\n\n    try {\n      const handlerResult = await handler(ctx, args);\n      return handlerResult;\n    } catch (error: any) {\n      result = `error:${error.code || \"UNKNOWN\"}`;\n      errorMessage = error.message;\n      throw error;\n    } finally {\n      const durationMs = Date.now() - startTime;\n\n      // Get user ID from auth context (simplified)\n      let userId: string | undefined;\n      try {\n        const identity = await ctx.auth.getUserIdentity();\n        userId = identity?.subject;\n      } catch {\n        // No auth context\n      }\n\n      await logAudit(ctx, {\n        userId,\n        action: \"mutation\",\n        resource,\n        args: args as Record<string, unknown>,\n        result,\n        errorMessage,\n        durationMs,\n      });\n    }\n  };\n}\n```\n\n---\n\n## Phase 8: Seed Data Generation\n\n**File: `packages/backend/convex/seed/index.ts` (CREATE)**\n\n```typescript\nimport { internalMutation } from \"../_generated/server\";\nimport { v } from \"convex/values\";\nimport { generateTerminals } from \"./terminals\";\nimport { generateContainers } from \"./containers\";\nimport { generateUsers } from \"./users\";\n\n/**\n * Main seed function - run manually from dashboard\n */\nexport const seedAll = internalMutation({\n  args: {\n    clearExisting: v.optional(v.boolean()),\n  },\n  returns: v.object({\n    terminals: v.number(),\n    gates: v.number(),\n    timeSlots: v.number(),\n    carriers: v.number(),\n    trucks: v.number(),\n    containers: v.number(),\n    operators: v.number(),\n  }),\n  handler: async (ctx, args) => {\n    if (args.clearExisting) {\n      // Clear all data (careful in production!)\n      // ... implementation\n    }\n\n    // Generate in order\n    const terminalResults = await generateTerminals(ctx);\n    const userResults = await generateUsers(ctx, terminalResults.terminals);\n    const containerResults = await generateContainers(ctx, userResults.carriers);\n\n    return {\n      terminals: terminalResults.count,\n      gates: terminalResults.gateCount,\n      timeSlots: terminalResults.slotCount,\n      carriers: userResults.carrierCount,\n      trucks: userResults.truckCount,\n      containers: containerResults.count,\n      operators: userResults.operatorCount,\n    };\n  },\n});\n```\n\n**File: `packages/backend/convex/seed/containers.ts` (CREATE)**\n\n```typescript\nimport type { MutationCtx } from \"../_generated/server\";\n\n// ISO 6346 owner codes (fictional)\nconst OWNER_CODES = [\"MSCU\", \"MAEU\", \"CMAU\", \"HLCU\", \"OOLU\", \"COSU\", \"EITU\", \"TCNU\"];\n\n// Container type distribution\nconst TYPE_DISTRIBUTION = {\n  dry: 0.60,\n  reefer: 0.15,\n  open_top: 0.08,\n  flat_rack: 0.07,\n  tank: 0.05,\n  hazardous: 0.05,\n};\n\n// Dimension distribution\nconst DIMENSION_DISTRIBUTION = {\n  \"20ft\": 0.35,\n  \"40ft\": 0.40,\n  \"40ft_hc\": 0.20,\n  \"45ft\": 0.05,\n};\n\n/**\n * Generate ISO 6346 compliant container number\n */\nfunction generateContainerNumber(ownerCode: string, index: number): string {\n  const serial = index.toString().padStart(6, \"0\");\n  // Simplified check digit (not real ISO calculation)\n  const checkDigit = (index % 10).toString();\n  return `${ownerCode}${serial}${checkDigit}`;\n}\n\n/**\n * Select from weighted distribution\n */\nfunction selectFromDistribution<T extends string>(\n  distribution: Record<T, number>\n): T {\n  const rand = Math.random();\n  let cumulative = 0;\n  for (const [key, weight] of Object.entries(distribution)) {\n    cumulative += weight as number;\n    if (rand <= cumulative) {\n      return key as T;\n    }\n  }\n  return Object.keys(distribution)[0] as T;\n}\n\nexport async function generateContainers(\n  ctx: MutationCtx,\n  carriers: { userId: string }[]\n): Promise<{ count: number }> {\n  const TARGET_CONTAINERS = 750;\n  const containersPerCarrier = Math.ceil(TARGET_CONTAINERS / carriers.length);\n\n  let totalCount = 0;\n  let containerIndex = 1;\n\n  for (const carrier of carriers) {\n    const ownerCode = OWNER_CODES[Math.floor(Math.random() * OWNER_CODES.length)];\n\n    for (let i = 0; i < containersPerCarrier && totalCount < TARGET_CONTAINERS; i++) {\n      const containerType = selectFromDistribution(TYPE_DISTRIBUTION);\n      const dimensions = selectFromDistribution(DIMENSION_DISTRIBUTION);\n      \n      // 70% drop-off, 30% pick-up\n      const operationType = Math.random() < 0.7 ? \"drop_off\" : \"pick_up\";\n      \n      // 30% empty\n      const isEmpty = Math.random() < 0.3;\n      \n      // Weight class based on type and empty status\n      let weightClass: \"light\" | \"medium\" | \"heavy\" | \"super_heavy\";\n      if (isEmpty) {\n        weightClass = \"light\";\n      } else if (containerType === \"hazardous\" || containerType === \"tank\") {\n        weightClass = Math.random() < 0.5 ? \"heavy\" : \"super_heavy\";\n      } else {\n        weightClass = selectFromDistribution({\n          light: 0.2,\n          medium: 0.4,\n          heavy: 0.3,\n          super_heavy: 0.1,\n        });\n      }\n\n      const now = Date.now();\n      await ctx.db.insert(\"containers\", {\n        ownerId: carrier.userId,\n        containerNumber: generateContainerNumber(ownerCode, containerIndex++),\n        containerType,\n        dimensions,\n        weightClass,\n        operationType,\n        isEmpty,\n        isActive: true,\n        readyDate: operationType === \"pick_up\" \n          ? now + Math.random() * 7 * 24 * 60 * 60 * 1000 \n          : undefined,\n        departureDate: operationType === \"drop_off\"\n          ? now + Math.random() * 14 * 24 * 60 * 60 * 1000\n          : undefined,\n        createdAt: now,\n        updatedAt: now,\n      });\n\n      totalCount++;\n    }\n  }\n\n  return { count: totalCount };\n}\n```\n\n---\n\n## Phase 9: Analytics\n\n**File: `packages/backend/convex/analytics/compute.ts` (CREATE)**\n\n```typescript\nimport { internalMutation } from \"../_generated/server\";\nimport { v } from \"convex/values\";\n\n/**\n * Compute hourly aggregates for all terminals\n */\nexport const computeHourlyAggregates = internalMutation({\n  args: {},\n  returns: v.number(), // Count of aggregates created\n  handler: async (ctx) => {\n    const now = new Date();\n    const currentHour = now.getUTCHours();\n    const dateStr = now.toISOString().slice(0, 10);\n\n    const terminals = await ctx.db.query(\"terminals\").collect();\n    let count = 0;\n\n    for (const terminal of terminals) {\n      // Get all bookings for this terminal, date, and hour\n      const bookings = await ctx.db\n        .query(\"bookings\")\n        .withIndex(\"by_terminal_and_date\", q =>\n          q.eq(\"terminalId\", terminal._id).eq(\"preferredDate\", dateStr)\n        )\n        .collect();\n\n      // Filter to current hour\n      const hourBookings = bookings.filter(b => {\n        const hour = parseInt(b.preferredTimeStart.split(\":\")[0], 10);\n        return hour === currentHour;\n      });\n\n      // Compute metrics\n      const metrics = {\n        totalBookings: hourBookings.length,\n        pendingCount: hourBookings.filter(b => b.status === \"pending\").length,\n        confirmedCount: hourBookings.filter(b => b.status === \"confirmed\").length,\n        rejectedCount: hourBookings.filter(b => b.status === \"rejected\").length,\n        consumedCount: hourBookings.filter(b => b.status === \"consumed\").length,\n        cancelledCount: hourBookings.filter(b => b.status === \"cancelled\").length,\n        expiredCount: hourBookings.filter(b => b.status === \"expired\").length,\n        autoValidatedCount: hourBookings.filter(b => b.wasAutoValidated).length,\n      };\n\n      // Container metrics\n      let totalContainers = 0;\n      let pickupCount = 0;\n      let dropoffCount = 0;\n\n      for (const booking of hourBookings) {\n        totalContainers += booking.containerIds.length;\n        for (const containerId of booking.containerIds) {\n          const container = await ctx.db.get(containerId);\n          if (container?.operationType === \"pick_up\") pickupCount++;\n          else dropoffCount++;\n        }\n      }\n\n      // Capacity metrics\n      const slot = await ctx.db\n        .query(\"timeSlots\")\n        .withIndex(\"by_terminal_and_date\", q =>\n          q.eq(\"terminalId\", terminal._id).eq(\"date\", dateStr)\n        )\n        .filter(q => q.eq(q.field(\"startTime\"), `${currentHour.toString().padStart(2, \"0\")}:00`))\n        .first();\n\n      const utilizationPercent = slot \n        ? Math.round((slot.currentBookings / slot.maxCapacity) * 100)\n        : 0;\n\n      // Timing metrics (average wait time from booking to confirm)\n      const confirmedBookings = hourBookings.filter(b => b.confirmedAt);\n      const avgWaitTimeMs = confirmedBookings.length > 0\n        ? confirmedBookings.reduce((sum, b) => sum + (b.confirmedAt! - b.bookedAt), 0) / confirmedBookings.length\n        : undefined;\n\n      // Upsert aggregate\n      const existing = await ctx.db\n        .query(\"bookingAggregates\")\n        .withIndex(\"by_terminal_and_date\", q =>\n          q.eq(\"terminalId\", terminal._id).eq(\"date\", dateStr)\n        )\n        .filter(q => q.eq(q.field(\"hour\"), currentHour))\n        .first();\n\n      if (existing) {\n        await ctx.db.patch(existing._id, {\n          ...metrics,\n          avgUtilizationPercent: utilizationPercent,\n          peakUtilizationPercent: Math.max(existing.peakUtilizationPercent, utilizationPercent),\n          totalContainers,\n          pickupCount,\n          dropoffCount,\n          avgWaitTimeMs,\n          computedAt: Date.now(),\n        });\n      } else {\n        await ctx.db.insert(\"bookingAggregates\", {\n          terminalId: terminal._id,\n          period: \"hourly\",\n          date: dateStr,\n          hour: currentHour,\n          ...metrics,\n          avgUtilizationPercent: utilizationPercent,\n          peakUtilizationPercent: utilizationPercent,\n          totalContainers,\n          pickupCount,\n          dropoffCount,\n          avgWaitTimeMs,\n          computedAt: Date.now(),\n        });\n        count++;\n      }\n    }\n\n    return count;\n  },\n});\n```\n\n**File: `packages/backend/convex/analytics/export.ts` (CREATE)**\n\n```typescript\n\"use node\";\nimport { action } from \"../_generated/server\";\nimport { v } from \"convex/values\";\nimport { internal } from \"../_generated/api\";\n\n/**\n * Export analytics to CSV\n */\nexport const exportToCSV = action({\n  args: {\n    terminalId: v.optional(v.id(\"terminals\")),\n    startDate: v.string(),\n    endDate: v.string(),\n    period: v.union(v.literal(\"hourly\"), v.literal(\"daily\")),\n  },\n  returns: v.string(), // CSV content\n  handler: async (ctx, args) => {\n    const aggregates = await ctx.runQuery(internal.analytics.queries.getAggregates, {\n      terminalId: args.terminalId,\n      startDate: args.startDate,\n      endDate: args.endDate,\n      period: args.period,\n    });\n\n    // Build CSV\n    const headers = [\n      \"Terminal\",\n      \"Date\",\n      \"Heure\",\n      \"Total Réservations\",\n      \"En attente\",\n      \"Confirmées\",\n      \"Refusées\",\n      \"Consommées\",\n      \"Annulées\",\n      \"Expirées\",\n      \"Auto-validées\",\n      \"Utilisation %\",\n      \"Conteneurs\",\n    ];\n\n    const rows = aggregates.map(a => [\n      a.terminalName,\n      a.date,\n      a.hour?.toString() ?? \"Journée\",\n      a.totalBookings,\n      a.pendingCount,\n      a.confirmedCount,\n      a.rejectedCount,\n      a.consumedCount,\n      a.cancelledCount,\n      a.expiredCount,\n      a.autoValidatedCount,\n      a.avgUtilizationPercent,\n      a.totalContainers,\n    ]);\n\n    const csv = [\n      headers.join(\",\"),\n      ...rows.map(r => r.join(\",\")),\n    ].join(\"\\n\");\n\n    return csv;\n  },\n});\n```\n\n---\n\n## Verification Strategy\n\n### Unit Tests\n\n```typescript\n// packages/backend/convex/__tests__/capacity.test.ts\ndescribe(\"Terminal Capacity Engine\", () => {\n  it(\"should reserve capacity atomically\", async () => {\n    // Test checkAndReserveCapacity\n  });\n\n  it(\"should release capacity on cancellation\", async () => {\n    // Test releaseCapacity\n  });\n\n  it(\"should auto-validate within threshold\", async () => {\n    // Test shouldAutoValidate\n  });\n\n  it(\"should reject auto-validation beyond threshold\", async () => {\n    // Test shouldAutoValidate returns false\n  });\n});\n\n// packages/backend/convex/__tests__/booking.test.ts\ndescribe(\"Booking Mutations\", () => {\n  it(\"should create booking with multiple containers\", async () => {\n    // Test create mutation\n  });\n\n  it(\"should assign gate at confirmation\", async () => {\n    // Test confirm mutation\n  });\n\n  it(\"should allow truck change only\", async () => {\n    // Test changeTruck mutation\n  });\n});\n```\n\n### Integration Tests\n\n```typescript\n// packages/backend/convex/__tests__/integration/booking-flow.test.ts\ndescribe(\"Booking Flow Integration\", () => {\n  it(\"should complete full booking lifecycle\", async () => {\n    // 1. Create booking\n    // 2. Confirm (with gate assignment)\n    // 3. Generate QR\n    // 4. Entry scan\n    // 5. Exit scan\n  });\n\n  it(\"should handle auto-validation correctly\", async () => {\n    // 1. Set threshold to 50%\n    // 2. Create bookings until threshold\n    // 3. Verify auto-validation stops\n  });\n});\n```\n\n### E2E Tests (Playwright)\n\n```typescript\n// apps/web/e2e/carrier-booking.spec.ts\ntest(\"carrier can create booking via AI chat\", async ({ page }) => {\n  // 1. Login as carrier\n  // 2. Open chat\n  // 3. Say \"Je veux créer une réservation\"\n  // 4. Follow AI prompts to select containers\n  // 5. Select optimal slot\n  // 6. Select truck\n  // 7. Confirm booking\n  // 8. Verify booking created\n});\n\n// apps/web/e2e/operator-approval.spec.ts\ntest(\"operator can approve pending bookings\", async ({ page }) => {\n  // 1. Login as operator\n  // 2. Go to approval queue\n  // 3. Select booking\n  // 4. Confirm with gate selection\n  // 5. Verify status change\n});\n\n// apps/web/e2e/qr-scan.spec.ts\ntest(\"operator can process QR scans\", async ({ page }) => {\n  // 1. Login as operator\n  // 2. Go to scanner\n  // 3. Scan entry QR\n  // 4. Verify booking status\n  // 5. Scan exit QR\n  // 6. Verify completion\n});\n```\n\n---\n\n## Critical Files Summary\n\n### Backend Core (Modify/Create)\n| File | Action | Priority |\n|------|--------|----------|\n| `packages/backend/convex/schema.ts` | Major Refactor | P0 |\n| `packages/backend/convex/lib/validators.ts` | Update | P0 |\n| `packages/backend/convex/lib/permissions.ts` | Update | P0 |\n| `packages/backend/convex/lib/capacity.ts` | Replace | P0 |\n| `packages/backend/convex/lib/autoValidation.ts` | Create | P0 |\n| `packages/backend/convex/lib/auditLog.ts` | Create | P1 |\n| `packages/backend/convex/containers/queries.ts` | Create | P0 |\n| `packages/backend/convex/containers/mutations.ts` | Create | P0 |\n| `packages/backend/convex/bookings/mutations.ts` | Major Refactor | P0 |\n| `packages/backend/convex/bookings/internal.ts` | Update | P0 |\n| `packages/backend/convex/trucks/mutations.ts` | Update | P1 |\n| `packages/backend/convex/ai/agent.ts` | Update | P0 |\n| `packages/backend/convex/ai/registry.ts` | Update | P0 |\n| `packages/backend/convex/ai/tools/containers.ts` | Create | P0 |\n| `packages/backend/convex/ai/tools/slots.ts` | Create | P0 |\n| `packages/backend/convex/ai/tools/booking-flow.ts` | Create | P0 |\n| `packages/backend/convex/ai/tools/trucks.ts` | Create | P0 |\n| `packages/backend/convex/ai/mutations.ts` | Create | P0 |\n| `packages/backend/convex/qr/index.ts` | Create | P1 |\n| `packages/backend/convex/qr/scan.ts` | Create | P1 |\n| `packages/backend/convex/email/index.ts` | Create | P1 |\n| `packages/backend/convex/analytics/compute.ts` | Create | P2 |\n| `packages/backend/convex/analytics/export.ts` | Create | P2 |\n| `packages/backend/convex/audit/queries.ts` | Create | P2 |\n| `packages/backend/convex/seed/index.ts` | Create | P2 |\n| `packages/backend/convex/crons.ts` | Update | P1 |\n| `packages/backend/convex/scheduled.ts` | Update | P1 |\n\n### Frontend (Create/Modify)\n| File | Action | Priority |\n|------|--------|----------|\n| `apps/web/src/components/ai-elements/apcs/container-selector.tsx` | Create | P0 |\n| `apps/web/src/components/ai-elements/apcs/slot-suggestions.tsx` | Create | P0 |\n| `apps/web/src/components/ai-elements/apcs/booking-confirmation-card.tsx` | Create | P0 |\n| `apps/web/src/features/scanner/components/qr-scanner.tsx` | Create | P1 |\n\n---\n\n## Timeline\n\n| Phase | Duration | Dependencies |\n|-------|----------|--------------|\n| 1. Schema Refactoring | 3-4 days | None |\n| 2. Core Backend Functions | 5-6 days | Phase 1 |\n| 3. AI Tools | 5-7 days | Phase 1, 2 |\n| 4. QR Code System | 2-3 days | Phase 2 |\n| 5. Notifications + Email | 3-4 days | Phase 2 |\n| 6. Cron Jobs | 1-2 days | Phase 2, 5 |\n| 7. Audit Logging | 2-3 days | Phase 1 |\n| 8. Seed Data | 2-3 days | All above |\n| 9. Analytics | 3-4 days | Phase 8 |\n\n**Total: 26-36 days (5-7 weeks)**\n"
}
```

**Output:**
```
Wrote file successfully.

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/convex.config.ts">
ERROR [2:19] Cannot find module '@convex-dev/agent/convex.config' or its corresponding type declarations.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/env/src/native.ts">
ERROR [10:15] Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/apps/web/src/components/ai-elements/message.tsx">
ERROR [3:32] Cannot find module 'ai' or its corresponding type declarations.
ERROR [18:21] Cannot find module '@streamdown/cjk' or its corresponding type declarations.
ERROR [19:22] Cannot find module '@streamdown/code' or its corresponding type declarations.
ERROR [20:22] Cannot find module '@streamdown/math' or its corresponding type declarations.
ERROR [21:25] Cannot find module '@streamdown/mermaid' or its corresponding type declarations.
ERROR [32:28] Cannot find module 'streamdown' or its corresponding type declarations.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/packages/backend/convex/ai/agent.ts">
ERROR [12:24] Cannot find module '@ai-sdk/google' or its corresponding type declarations.
ERROR [13:23] Cannot find module '@convex-dev/agent' or its corresponding type declarations.
</diagnostics>

LSP errors detected in other files:
<diagnostics file="/home/sones/projects/monorepo/apps/web/src/components/ai-elements/conversation.tsx">
ERROR [9:56] Cannot find module 'use-stick-to-bottom' or its corresponding type declarations.
</diagnostics>
```

---

## Assistant (Plan · claude-opus-4.5 · 724.2s)

I've written the exhaustive backend implementation plan. Let me provide a summary of what's included:

## Plan Summary

The plan file at `.opencode/plans/1770398316992-lucky-meadow.md` now contains **comprehensive implementation details** covering:

### Schema Changes (Phase 1)
- **Remove** `carrierCompanies` and `carrierUsers` tables
- **Add** `containers` table with full ISO 6346 support
- **Refactor** `trucks` (direct ownership via `ownerId`)
- **Refactor** `bookings` (terminal-level, multiple containers, auto-validation)
- **Refactor** `timeSlots` (terminal-level capacity)
- **Add** `auditLogs` and `bookingAggregates` tables
- **Update** `terminals` (add auto-validation threshold, capacity alerts)

### Core Functions (Phase 2)
- Container CRUD with full queries and mutations
- Terminal-level capacity engine (replaces gate-level)
- Auto-validation engine with configurable thresholds
- Gate assignment at approval time (load-balanced)
- Refactored booking mutations with:
  - Multi-container support
  - Auto-validation logic
  - Terminal-prefixed references (e.g., `TER1-BK-001234`)

### AI Tools (Phase 3) - French Only
- `listMyContainers`, `selectContainersForBooking`
- `getSlotAvailability`, `suggestOptimalSlots`
- `createBookingViaAI`, `cancelBookingViaAI`, `changeTruckViaAI`
- `listMyTrucks`
- Updated agent instructions in French

### Additional Systems (Phases 4-9)
- QR code generation and double-scan system
- Email notifications via Resend
- Cron jobs for expiration, reminders, capacity alerts, analytics
- Audit logging with `withAudit()` wrapper
- Seed data generation (~750 containers)
- Analytics aggregation and CSV/PDF export

### Verification Strategy
- Unit tests for capacity and booking logic
- Integration tests for full booking lifecycle
- E2E tests with Playwright

**Total estimated duration: 26-36 days (5-7 weeks)**

**Tool: plan_exit**

**Input:**
```json
{}
```

**Error:**
```
Error: The user dismissed this question
```

---

## User

Are you considering that slots are created on first book? I saw this and it's confusing me
}

  // Find the slot
  const slot = await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", q =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .filter(q => q.eq(q.field("startTime"), startTime))
    .first();

  if (!slot) {
    // No slot yet means first booking - auto-validate
    const threshold = terminal.autoValidationThreshold;
    const maxCapacity = terminal.defaultSlotCapacity;
    const maxAutoValidated = Math.floor((maxCapacity * threshold) / 100); 

---

## Assistant (Plan · claude-opus-4.5 · 243.4s)

_Thinking:_

The user is asking about the design decision where time slots are created on-demand (when the first booking is made) rather than being pre-created. This is indeed a design choice that needs clarification.

Looking at the plan, there are two places where this comes up:
1. In `checkAndReserveCapacity` - which creates a slot if it doesn't exist
2. In `shouldAutoValidate` - which handles the case where no slot exists yet

The user seems confused about whether:
1. Slots should be pre-created by operators/admins
2. Slots should be created on-demand when first booked

This is an important architectural decision. Let me think about the pros and cons:

**Option A: Pre-created slots (operator creates them)**
- Pros: 
  - Operators have full control over which slots are available
  - Can customize capacity per slot ahead of time
  - Clearer for operators to manage
- Cons:
  - More administrative work
  - Need bulk creation tools

**Option B: On-demand slots (created on first booking)**
- Pros:
  - Less administrative overhead
  - System automatically handles any time the terminal is open
- Cons:
  - Less control over individual slots
  - Can be confusing (as the user points out)
  - Harder to close specific time slots

**Option C: Hybrid - slots are pre-generated based on terminal operating hours, but can be customized**
- Terminal has operating hours (e.g., 06:00-22:00) and slot duration (e.g., 60 min)
- System auto-generates slots for X days ahead (cron job)
- Operators can then customize individual slots or disable them

I should ask the user which approach they prefer, as this is an important architectural decision.

You raise a valid point. The plan currently has a **hybrid approach** that might be confusing:

1. **In `checkAndReserveCapacity`**: Creates a slot on-demand if it doesn't exist
2. **In `shouldAutoValidate`**: Handles the "no slot yet" case

This creates ambiguity about slot management. Let me clarify the options:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "How should time slots be managed? This affects capacity planning and operator control.",
      "header": "Slot Creation Strategy",
      "options": [
        {
          "label": "Pre-generated (Recommended)",
          "description": "Slots auto-generated daily based on terminal operating hours (e.g., 06:00-22:00, 1h slots). Operators can then customize or disable individual slots."
        },
        {
          "label": "Operator-created only",
          "description": "Operators must manually create all slots. More control but more administrative work. Requires bulk creation tools."
        },
        {
          "label": "On-demand (current plan)",
          "description": "Slots created when first booking is made. Less admin work but less control over availability."
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "How should time slots be managed? This affects capacity planning and operator control."="Slot configuration is static (we can configure 24 times 7 slots, one hour per slot) but slots are creating dynamically. Expected behavior: if I check the availability of a slot with no bookings, I should be able to retrieve it and find it empty.". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · claude-opus-4.5 · 11.9s)

That clarifies it. The model should be:

**Slot Configuration = Static** (24 slots × 7 days = 168 slot definitions per terminal)
**Slot Instances = Dynamic** (created on-demand, but readable even when empty)

So the behavior should be:

1. **Terminal defines a slot template** (operating hours: 00:00-23:00, 1h duration = 24 slots/day)
2. **When querying availability**: Return all possible slots for the date, showing `0/maxCapacity` for empty ones
3. **When booking**: Create the slot record on first booking (or just track bookings against the template)

This means the `shouldAutoValidate` logic I wrote is **correct** - it handles the "no slot record yet" case by using terminal defaults. But the **availability query** needs to return slots that don't have records yet.

Let me update the plan to make this clearer:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "offset": 0,
  "limit": 100
}
```

**Output:**
```
<file>
00001| # APCS Maritime Port Booking System - Exhaustive Backend Implementation Plan
00002| 
00003| ## Executive Summary
00004| 
00005| This plan details the complete backend implementation for APCS (Advanced Port Container System). The system transforms from a gate-level booking model to a **terminal-level capacity model** with **container-centric bookings** and a **French-only AI assistant**.
00006| 
00007| ### Key Architectural Changes
00008| 
00009| | Current State | Target State |
00010| |--------------|--------------|
00011| | Carrier companies own trucks | Trucks owned directly by carrier users |
00012| | Gate-level capacity | Terminal-level capacity (truck count) |
00013| | Single container per booking | Multiple containers per booking |
00014| | Manual approval only | Auto-validation (first N% auto-approved) |
00015| | Gate assigned at booking | Gate assigned at approval |
00016| | Bilingual (EN/FR) | French only |
00017| | No containers table | Pre-seeded containers assigned to carriers |
00018| 
00019| ---
00020| 
00021| ## Phase 1: Schema Refactoring
00022| 
00023| **Files to Modify:**
00024| - `packages/backend/convex/schema.ts` (major refactor)
00025| - `packages/backend/convex/lib/validators.ts` (add new validators)
00026| 
00027| ### 1.1 Tables to Remove
00028| 
00029| ```typescript
00030| // DELETE these tables entirely
00031| carrierCompanies: defineTable({ ... })  // REMOVE
00032| carrierUsers: defineTable({ ... })      // REMOVE
00033| ```
00034| 
00035| ### 1.2 New `containers` Table
00036| 
00037| ```typescript
00038| /** Container type (ISO standard classifications) */
00039| export const containerTypeValidator = v.union(
00040|   v.literal("dry"),           // Standard dry container
00041|   v.literal("reefer"),        // Refrigerated
00042|   v.literal("open_top"),      // Open top
00043|   v.literal("flat_rack"),     // Flat rack
00044|   v.literal("tank"),          // Tank container
00045|   v.literal("hazardous")      // Hazardous materials
00046| );
00047| 
00048| /** Container dimensions (ISO standard) */
00049| export const containerDimensionsValidator = v.union(
00050|   v.literal("20ft"),          // 20' standard
00051|   v.literal("40ft"),          // 40' standard
00052|   v.literal("40ft_hc"),       // 40' high cube
00053|   v.literal("45ft")           // 45' high cube
00054| );
00055| 
00056| /** Container weight class */
00057| export const containerWeightClassValidator = v.union(
00058|   v.literal("light"),         // < 10 tons
00059|   v.literal("medium"),        // 10-20 tons
00060|   v.literal("heavy"),         // 20-30 tons
00061|   v.literal("super_heavy")    // > 30 tons
00062| );
00063| 
00064| /** Container operation type */
00065| export const containerOperationValidator = v.union(
00066|   v.literal("pick_up"),       // Carrier picks up from terminal
00067|   v.literal("drop_off")       // Carrier drops off at terminal
00068| );
00069| 
00070| containers: defineTable({
00071|   // Ownership
00072|   ownerId: v.string(),                          // Better Auth user ID (carrier role)
00073|   
00074|   // ISO 6346 container identification
00075|   containerNumber: v.string(),                   // e.g., "MSCU1234567"
00076|   
00077|   // Classification
00078|   containerType: containerTypeValidator,
00079|   dimensions: containerDimensionsValidator,
00080|   weightClass: containerWeightClassValidator,
00081|   
00082|   // Operation details
00083|   operationType: containerOperationValidator,
00084|   
00085|   // For pick_up: when container will be ready for collection
00086|   readyDate: v.optional(v.number()),
00087|   // For drop_off: expected departure date from terminal
00088|   departureDate: v.optional(v.number()),
00089|   
00090|   // State
00091|   isEmpty: v.boolean(),                          // Empty vs loaded
00092|   isActive: v.boolean(),                         // Soft delete flag
00093|   
00094|   // Booking association (null if not booked)
00095|   bookingId: v.optional(v.id("bookings")),
00096|   
00097|   // Metadata
00098|   notes: v.optional(v.string()),
00099|   createdAt: v.number(),
00100|   updatedAt: v.number(),

(File has more lines. Use 'offset' parameter to read beyond line 100)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 12.1s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "oldString": "| Bilingual (EN/FR) | French only |\n| No containers table | Pre-seeded containers assigned to carriers |\n\n---\n\n## Phase 1: Schema Refactoring",
  "newString": "| Bilingual (EN/FR) | French only |\n| No containers table | Pre-seeded containers assigned to carriers |\n\n### Slot Management Model\n\n**Configuration = Static, Instances = Dynamic**\n\n- Terminals define a **slot template**: operating hours (e.g., 00:00-23:00) + slot duration (1 hour) = 24 possible slots/day\n- **No pre-creation of slot records** - slots are virtual until first booking\n- **Availability queries** return all possible slots based on template, showing `0/capacity` for empty slots\n- **Slot records created on first booking** to track `currentBookings` count\n- This avoids creating 168+ slot records per terminal per week while still showing full availability\n\n---\n\n## Phase 1: Schema Refactoring"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Plan · claude-opus-4.5 · 5.9s)

Now let me update the `timeSlots` table definition and the capacity functions to reflect this model more clearly:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "offset": 150,
  "limit": 100
}
```

**Output:**
```
<file>
00151| 
00152| ### 1.4 Refactored `bookings` Table
00153| 
00154| ```typescript
00155| bookings: defineTable({
00156|   // CHANGED: Terminal-level (gate assigned later)
00157|   terminalId: v.id("terminals"),
00158|   carrierId: v.string(),                         // Better Auth user ID (was carrierCompanyId)
00159|   truckId: v.id("trucks"),
00160|   
00161|   // CHANGED: Gate assigned at approval, not booking
00162|   gateId: v.optional(v.id("gates")),             // Now optional, assigned on confirm
00163|   
00164|   // CHANGED: Multiple containers per booking
00165|   containerIds: v.array(v.id("containers")),
00166|   
00167|   // Reference (terminal-prefixed)
00168|   bookingReference: v.string(),                   // e.g., "TER1-BK-001234"
00169|   status: bookingStatusValidator,
00170|   
00171|   // ADDED: Auto-validation tracking
00172|   wasAutoValidated: v.boolean(),
00173|   
00174|   // Preferred slot (before gate assignment)
00175|   preferredDate: v.string(),                      // YYYY-MM-DD
00176|   preferredTimeStart: v.string(),                 // HH:mm
00177|   preferredTimeEnd: v.string(),                   // HH:mm
00178|   
00179|   // ADDED: QR scan timestamps
00180|   entryScannedAt: v.optional(v.number()),
00181|   exitScannedAt: v.optional(v.number()),
00182|   scannedByEntry: v.optional(v.string()),        // Operator who scanned entry
00183|   scannedByExit: v.optional(v.string()),         // Operator who scanned exit
00184|   
00185|   // QR code
00186|   qrCode: v.optional(v.string()),                 // Data URL
00187|   qrCodeStorageId: v.optional(v.id("_storage")), // Convex file storage
00188|   
00189|   // Driver info
00190|   driverName: v.optional(v.string()),
00191|   driverPhone: v.optional(v.string()),
00192|   driverIdNumber: v.optional(v.string()),
00193|   
00194|   // Timestamps
00195|   bookedAt: v.number(),
00196|   confirmedAt: v.optional(v.number()),
00197|   rejectedAt: v.optional(v.number()),
00198|   cancelledAt: v.optional(v.number()),
00199|   expiredAt: v.optional(v.number()),
00200|   
00201|   // Status metadata
00202|   statusReason: v.optional(v.string()),
00203|   processedBy: v.optional(v.string()),
00204|   
00205|   createdBy: v.string(),
00206|   updatedAt: v.number(),
00207| })
00208|   .index("by_reference", ["bookingReference"])
00209|   .index("by_carrier", ["carrierId"])
00210|   .index("by_carrier_and_status", ["carrierId", "status"])
00211|   .index("by_terminal", ["terminalId"])
00212|   .index("by_terminal_and_status", ["terminalId", "status"])
00213|   .index("by_terminal_and_date", ["terminalId", "preferredDate"])
00214|   .index("by_gate", ["gateId"])
00215|   .index("by_truck", ["truckId"])
00216|   .index("by_status", ["status"])
00217|   .index("by_date", ["preferredDate"])
00218|   .index("by_created_by", ["createdBy"]),
00219| ```
00220| 
00221| ### 1.5 Refactored `timeSlots` Table
00222| 
00223| ```typescript
00224| timeSlots: defineTable({
00225|   // CHANGED: Terminal-level, not gate-level
00226|   terminalId: v.id("terminals"),
00227|   
00228|   date: v.string(),                               // YYYY-MM-DD
00229|   startTime: v.string(),                          // HH:mm (24h)
00230|   endTime: v.string(),                            // HH:mm (24h)
00231|   
00232|   // Terminal capacity (truck count)
00233|   maxCapacity: v.number(),
00234|   currentBookings: v.number(),                    // Confirmed + pending count
00235|   
00236|   // ADDED: Auto-validation threshold for this slot
00237|   autoValidationThreshold: v.optional(v.number()), // Override terminal default (0-100%)
00238|   
00239|   isActive: v.boolean(),
00240|   createdAt: v.number(),
00241|   updatedAt: v.number(),
00242|   createdBy: v.string(),
00243| })
00244|   // CHANGED indexes
00245|   .index("by_terminal", ["terminalId"])
00246|   .index("by_terminal_and_date", ["terminalId", "date"])
00247|   .index("by_date", ["date"])
00248|   .index("by_terminal_and_active", ["terminalId", "isActive"]),
00249| ```
00250| 

(File has more lines. Use 'offset' parameter to read beyond line 250)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 13.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "oldString": "### 1.5 Refactored `timeSlots` Table\n\n```typescript\ntimeSlots: defineTable({\n  // CHANGED: Terminal-level, not gate-level\n  terminalId: v.id(\"terminals\"),\n  \n  date: v.string(),                               // YYYY-MM-DD\n  startTime: v.string(),                          // HH:mm (24h)\n  endTime: v.string(),                            // HH:mm (24h)\n  \n  // Terminal capacity (truck count)\n  maxCapacity: v.number(),\n  currentBookings: v.number(),                    // Confirmed + pending count\n  \n  // ADDED: Auto-validation threshold for this slot\n  autoValidationThreshold: v.optional(v.number()), // Override terminal default (0-100%)\n  \n  isActive: v.boolean(),\n  createdAt: v.number(),\n  updatedAt: v.number(),\n  createdBy: v.string(),\n})\n  // CHANGED indexes\n  .index(\"by_terminal\", [\"terminalId\"])\n  .index(\"by_terminal_and_date\", [\"terminalId\", \"date\"])\n  .index(\"by_date\", [\"date\"])\n  .index(\"by_terminal_and_active\", [\"terminalId\", \"isActive\"]),\n```",
  "newString": "### 1.5 Refactored `timeSlots` Table\n\n**Note: Slot records are ONLY created when a booking is made for that slot.**\nVirtual slots (no bookings yet) are computed from terminal operating hours.\n\n```typescript\ntimeSlots: defineTable({\n  // CHANGED: Terminal-level, not gate-level\n  terminalId: v.id(\"terminals\"),\n  \n  date: v.string(),                               // YYYY-MM-DD\n  startTime: v.string(),                          // HH:mm (24h)\n  endTime: v.string(),                            // HH:mm (24h)\n  \n  // Terminal capacity (truck count) - inherited from terminal.defaultSlotCapacity\n  maxCapacity: v.number(),\n  currentBookings: v.number(),                    // Confirmed + pending count\n  \n  // ADDED: Auto-validation threshold for this slot (override terminal default)\n  autoValidationThreshold: v.optional(v.number()), // 0-100%, null = use terminal default\n  \n  // Slot can be disabled by operator\n  isActive: v.boolean(),\n  createdAt: v.number(),\n  updatedAt: v.number(),\n  createdBy: v.string(),\n})\n  .index(\"by_terminal\", [\"terminalId\"])\n  .index(\"by_terminal_and_date\", [\"terminalId\", \"date\"])\n  .index(\"by_date\", [\"date\"])\n  .index(\"by_terminal_and_active\", [\"terminalId\", \"isActive\"]),\n```"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Plan · claude-opus-4.5 · 5.7s)

Now let me update the capacity functions to better explain the virtual slot logic:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "limit": 150,
  "offset": 380
}
```

**Output:**
```
<file>
00381| 
00382| ### 1.9 Updated `systemConfig` Table
00383| 
00384| ```typescript
00385| systemConfig: defineTable({
00386|   // Booking window
00387|   maxAdvanceBookingDays: v.number(),              // e.g., 30
00388|   minAdvanceBookingHours: v.number(),             // e.g., 2
00389|   
00390|   // REMOVED: cancellationWindowHours (carriers can cancel anytime)
00391|   
00392|   // ADDED: No-show handling
00393|   noShowGracePeriodMinutes: v.number(),           // e.g., 30
00394|   
00395|   // ADDED: Auto-validation defaults
00396|   defaultAutoValidationThreshold: v.number(),     // 0-100, global default
00397|   
00398|   // Reminder settings
00399|   reminderHoursBefore: v.array(v.number()),
00400|   
00401|   // ADDED: Container settings
00402|   maxContainersPerBooking: v.number(),            // e.g., 10
00403|   
00404|   updatedAt: v.number(),
00405|   updatedBy: v.string(),
00406| }),
00407| ```
00408| 
00409| ### 1.10 Updated `userProfiles` Table
00410| 
00411| ```typescript
00412| userProfiles: defineTable({
00413|   userId: v.string(),
00414|   
00415|   // CHANGED: French only, but keep field for future
00416|   preferredLanguage: v.literal("fr"),             // Always French
00417|   notificationChannel: notificationChannelValidator,
00418|   
00419|   phone: v.optional(v.string()),
00420|   
00421|   createdAt: v.number(),
00422|   updatedAt: v.number(),
00423| })
00424|   .index("by_user", ["userId"]),
00425| ```
00426| 
00427| ---
00428| 
00429| ## Phase 2: Core Backend Functions
00430| 
00431| ### 2.1 Container CRUD
00432| 
00433| **File: `packages/backend/convex/containers/queries.ts`**
00434| 
00435| ```typescript
00436| import { query } from "../_generated/server";
00437| import { v } from "convex/values";
00438| import { getAuthenticatedUser, requireRole, isPortAdmin } from "../lib/permissions";
00439| 
00440| /**
00441|  * List containers for the current carrier user
00442|  */
00443| export const listMy = query({
00444|   args: {
00445|     operationType: v.optional(containerOperationValidator),
00446|     includeBooked: v.optional(v.boolean()),       // Include containers in bookings
00447|     limit: v.optional(v.number()),
00448|   },
00449|   returns: v.array(v.object({
00450|     _id: v.id("containers"),
00451|     containerNumber: v.string(),
00452|     containerType: containerTypeValidator,
00453|     dimensions: containerDimensionsValidator,
00454|     weightClass: containerWeightClassValidator,
00455|     operationType: containerOperationValidator,
00456|     isEmpty: v.boolean(),
00457|     bookingId: v.optional(v.id("bookings")),
00458|     readyDate: v.optional(v.number()),
00459|     departureDate: v.optional(v.number()),
00460|   })),
00461|   handler: async (ctx, args) => {
00462|     const user = await getAuthenticatedUser(ctx);
00463|     requireRole(user, ["carrier"]);
00464| 
00465|     let query = ctx.db
00466|       .query("containers")
00467|       .withIndex("by_owner_and_active", q => 
00468|         q.eq("ownerId", user.userId).eq("isActive", true)
00469|       );
00470| 
00471|     const containers = await query.collect();
00472| 
00473|     return containers
00474|       .filter(c => {
00475|         if (args.operationType && c.operationType !== args.operationType) return false;
00476|         if (!args.includeBooked && c.bookingId) return false;
00477|         return true;
00478|       })
00479|       .slice(0, args.limit ?? 100)
00480|       .map(c => ({
00481|         _id: c._id,
00482|         containerNumber: c.containerNumber,
00483|         containerType: c.containerType,
00484|         dimensions: c.dimensions,
00485|         weightClass: c.weightClass,
00486|         operationType: c.operationType,
00487|         isEmpty: c.isEmpty,
00488|         bookingId: c.bookingId,
00489|         readyDate: c.readyDate,
00490|         departureDate: c.departureDate,
00491|       }));
00492|   },
00493| });
00494| 
00495| /**
00496|  * Get available containers for booking (not already in a booking)
00497|  */
00498| export const listAvailable = query({
00499|   args: {
00500|     operationType: v.optional(containerOperationValidator),
00501|   },
00502|   returns: v.array(v.object({
00503|     _id: v.id("containers"),
00504|     containerNumber: v.string(),
00505|     containerType: containerTypeValidator,
00506|     dimensions: containerDimensionsValidator,
00507|     operationType: containerOperationValidator,
00508|     isEmpty: v.boolean(),
00509|   })),
00510|   handler: async (ctx, args) => {
00511|     const user = await getAuthenticatedUser(ctx);
00512|     requireRole(user, ["carrier"]);
00513| 
00514|     const containers = await ctx.db
00515|       .query("containers")
00516|       .withIndex("by_owner_available", q =>
00517|         q.eq("ownerId", user.userId).eq("isActive", true).eq("bookingId", undefined)
00518|       )
00519|       .collect();
00520| 
00521|     return containers
00522|       .filter(c => !args.operationType || c.operationType === args.operationType)
00523|       .map(c => ({
00524|         _id: c._id,
00525|         containerNumber: c.containerNumber,
00526|         containerType: c.containerType,
00527|         dimensions: c.dimensions,
00528|         operationType: c.operationType,
00529|         isEmpty: c.isEmpty,
00530|       }));

(File has more lines. Use 'offset' parameter to read beyond line 530)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 6.5s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "limit": 150,
  "offset": 580
}
```

**Output:**
```
<file>
00581| });
00582| ```
00583| 
00584| **File: `packages/backend/convex/containers/mutations.ts`**
00585| 
00586| ```typescript
00587| import { mutation } from "../_generated/server";
00588| import { v, ConvexError } from "convex/values";
00589| import { getAuthenticatedUser, requireRole, isPortAdmin } from "../lib/permissions";
00590| 
00591| /**
00592|  * Create a container (admin only - containers are pre-seeded)
00593|  */
00594| export const create = mutation({
00595|   args: {
00596|     ownerId: v.string(),
00597|     containerNumber: v.string(),
00598|     containerType: containerTypeValidator,
00599|     dimensions: containerDimensionsValidator,
00600|     weightClass: containerWeightClassValidator,
00601|     operationType: containerOperationValidator,
00602|     isEmpty: v.boolean(),
00603|     readyDate: v.optional(v.number()),
00604|     departureDate: v.optional(v.number()),
00605|     notes: v.optional(v.string()),
00606|   },
00607|   returns: v.id("containers"),
00608|   handler: async (ctx, args) => {
00609|     const user = await getAuthenticatedUser(ctx);
00610|     requireRole(user, ["port_admin"]);
00611| 
00612|     // Validate container number format (ISO 6346)
00613|     if (!isValidContainerNumber(args.containerNumber)) {
00614|       throw new ConvexError({
00615|         code: "INVALID_INPUT",
00616|         message: "Numéro de conteneur invalide (format ISO 6346 requis)",
00617|       });
00618|     }
00619| 
00620|     // Check for duplicate
00621|     const existing = await ctx.db
00622|       .query("containers")
00623|       .withIndex("by_container_number", q => q.eq("containerNumber", args.containerNumber))
00624|       .first();
00625| 
00626|     if (existing) {
00627|       throw new ConvexError({
00628|         code: "DUPLICATE",
00629|         message: "Ce numéro de conteneur existe déjà",
00630|       });
00631|     }
00632| 
00633|     const now = Date.now();
00634|     return await ctx.db.insert("containers", {
00635|       ...args,
00636|       isActive: true,
00637|       createdAt: now,
00638|       updatedAt: now,
00639|     });
00640|   },
00641| });
00642| 
00643| /**
00644|  * Update container details (carrier can update their own)
00645|  */
00646| export const update = mutation({
00647|   args: {
00648|     containerId: v.id("containers"),
00649|     isEmpty: v.optional(v.boolean()),
00650|     readyDate: v.optional(v.number()),
00651|     departureDate: v.optional(v.number()),
00652|     notes: v.optional(v.string()),
00653|   },
00654|   returns: v.null(),
00655|   handler: async (ctx, args) => {
00656|     const user = await getAuthenticatedUser(ctx);
00657|     const container = await ctx.db.get(args.containerId);
00658| 
00659|     if (!container) {
00660|       throw new ConvexError({ code: "NOT_FOUND", message: "Conteneur introuvable" });
00661|     }
00662| 
00663|     if (!isPortAdmin(user) && container.ownerId !== user.userId) {
00664|       throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
00665|     }
00666| 
00667|     // Cannot update if in an active booking
00668|     if (container.bookingId) {
00669|       const booking = await ctx.db.get(container.bookingId);
00670|       if (booking && (booking.status === "pending" || booking.status === "confirmed")) {
00671|         throw new ConvexError({
00672|           code: "INVALID_STATE",
00673|           message: "Impossible de modifier un conteneur dans une réservation active",
00674|         });
00675|       }
00676|     }
00677| 
00678|     await ctx.db.patch(args.containerId, {
00679|       isEmpty: args.isEmpty ?? container.isEmpty,
00680|       readyDate: args.readyDate,
00681|       departureDate: args.departureDate,
00682|       notes: args.notes,
00683|       updatedAt: Date.now(),
00684|     });
00685| 
00686|     return null;
00687|   },
00688| });
00689| 
00690| // Helper: Validate ISO 6346 container number
00691| function isValidContainerNumber(num: string): boolean {
00692|   // Format: 4 letters (owner) + 6 digits + 1 check digit
00693|   // Example: MSCU1234567
00694|   const regex = /^[A-Z]{4}\d{7}$/;
00695|   return regex.test(num);
00696| }
00697| ```
00698| 
00699| ### 2.2 Terminal-Level Capacity Engine
00700| 
00701| **File: `packages/backend/convex/lib/capacity.ts` (REPLACE)**
00702| 
00703| ```typescript
00704| /**
00705|  * Terminal-Level Capacity Management
00706|  * Handles atomic capacity reservation at the terminal level (not gate)
00707|  */
00708| import type { MutationCtx, QueryCtx } from "../_generated/server";
00709| import type { Id, Doc } from "../_generated/dataModel";
00710| 
00711| export interface CapacityResult {
00712|   available: number;
00713|   total: number;
00714|   booked: number;
00715|   utilizationPercent: number;
00716| }
00717| 
00718| export interface SlotCapacity extends CapacityResult {
00719|   slotId: Id<"timeSlots">;
00720|   date: string;
00721|   startTime: string;
00722|   endTime: string;
00723|   autoValidationThreshold: number;
00724|   autoValidatedCount: number;
00725|   remainingAutoValidation: number;
00726| }
00727| 
00728| /**
00729|  * Get slot for terminal and time
00730|  */

(File has more lines. Use 'offset' parameter to read beyond line 730)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 6.0s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "limit": 150,
  "offset": 730
}
```

**Output:**
```
<file>
00731| export async function getSlotForTerminal(
00732|   ctx: QueryCtx,
00733|   terminalId: Id<"terminals">,
00734|   date: string,
00735|   startTime: string
00736| ): Promise<Doc<"timeSlots"> | null> {
00737|   return await ctx.db
00738|     .query("timeSlots")
00739|     .withIndex("by_terminal_and_date", q => 
00740|       q.eq("terminalId", terminalId).eq("date", date)
00741|     )
00742|     .filter(q => q.eq(q.field("startTime"), startTime))
00743|     .first();
00744| }
00745| 
00746| /**
00747|  * Check if a terminal slot has capacity and atomically reserve if available
00748|  */
00749| export async function checkAndReserveCapacity(
00750|   ctx: MutationCtx,
00751|   terminalId: Id<"terminals">,
00752|   date: string,
00753|   startTime: string,
00754|   endTime: string
00755| ): Promise<{ success: boolean; slotId?: Id<"timeSlots">; error?: string }> {
00756|   // Find or create the slot
00757|   let slot = await getSlotForTerminal(ctx, terminalId, date, startTime);
00758|   
00759|   if (!slot) {
00760|     // Create slot on-demand with terminal defaults
00761|     const terminal = await ctx.db.get(terminalId);
00762|     if (!terminal) {
00763|       return { success: false, error: "Terminal introuvable" };
00764|     }
00765| 
00766|     const now = Date.now();
00767|     const slotId = await ctx.db.insert("timeSlots", {
00768|       terminalId,
00769|       date,
00770|       startTime,
00771|       endTime,
00772|       maxCapacity: terminal.defaultSlotCapacity,
00773|       currentBookings: 0,
00774|       isActive: true,
00775|       createdAt: now,
00776|       updatedAt: now,
00777|       createdBy: "system",
00778|     });
00779| 
00780|     slot = await ctx.db.get(slotId);
00781|   }
00782| 
00783|   if (!slot || !slot.isActive) {
00784|     return { success: false, error: "Créneau horaire indisponible" };
00785|   }
00786| 
00787|   // Check capacity
00788|   if (slot.currentBookings >= slot.maxCapacity) {
00789|     return { success: false, error: "Créneau complet" };
00790|   }
00791| 
00792|   // Atomically increment
00793|   await ctx.db.patch(slot._id, {
00794|     currentBookings: slot.currentBookings + 1,
00795|     updatedAt: Date.now(),
00796|   });
00797| 
00798|   return { success: true, slotId: slot._id };
00799| }
00800| 
00801| /**
00802|  * Release capacity (on cancellation/rejection/expiration)
00803|  */
00804| export async function releaseCapacity(
00805|   ctx: MutationCtx,
00806|   slotId: Id<"timeSlots">
00807| ): Promise<void> {
00808|   const slot = await ctx.db.get(slotId);
00809|   if (!slot) return;
00810| 
00811|   await ctx.db.patch(slotId, {
00812|     currentBookings: Math.max(0, slot.currentBookings - 1),
00813|     updatedAt: Date.now(),
00814|   });
00815| }
00816| 
00817| /**
00818|  * Get terminal capacity for a specific date
00819|  */
00820| export async function getTerminalCapacityForDate(
00821|   ctx: QueryCtx,
00822|   terminalId: Id<"terminals">,
00823|   date: string
00824| ): Promise<SlotCapacity[]> {
00825|   const terminal = await ctx.db.get(terminalId);
00826|   if (!terminal) return [];
00827| 
00828|   const slots = await ctx.db
00829|     .query("timeSlots")
00830|     .withIndex("by_terminal_and_date", q => 
00831|       q.eq("terminalId", terminalId).eq("date", date)
00832|     )
00833|     .collect();
00834| 
00835|   const results: SlotCapacity[] = [];
00836| 
00837|   for (const slot of slots) {
00838|     // Count auto-validated bookings for this slot
00839|     const bookings = await ctx.db
00840|       .query("bookings")
00841|       .withIndex("by_terminal_and_date", q =>
00842|         q.eq("terminalId", terminalId).eq("preferredDate", date)
00843|       )
00844|       .filter(q => 
00845|         q.and(
00846|           q.eq(q.field("preferredTimeStart"), slot.startTime),
00847|           q.or(
00848|             q.eq(q.field("status"), "pending"),
00849|             q.eq(q.field("status"), "confirmed")
00850|           )
00851|         )
00852|       )
00853|       .collect();
00854| 
00855|     const autoValidatedCount = bookings.filter(b => b.wasAutoValidated).length;
00856|     const threshold = slot.autoValidationThreshold ?? terminal.autoValidationThreshold;
00857|     const maxAutoValidated = Math.floor((slot.maxCapacity * threshold) / 100);
00858| 
00859|     results.push({
00860|       slotId: slot._id,
00861|       date: slot.date,
00862|       startTime: slot.startTime,
00863|       endTime: slot.endTime,
00864|       available: Math.max(0, slot.maxCapacity - slot.currentBookings),
00865|       total: slot.maxCapacity,
00866|       booked: slot.currentBookings,
00867|       utilizationPercent: Math.round((slot.currentBookings / slot.maxCapacity) * 100),
00868|       autoValidationThreshold: threshold,
00869|       autoValidatedCount,
00870|       remainingAutoValidation: Math.max(0, maxAutoValidated - autoValidatedCount),
00871|     });
00872|   }
00873| 
00874|   return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
00875| }
00876| 
00877| /**
00878|  * Recalculate capacity for all slots of a terminal on a date
00879|  */
00880| export async function recalculateTerminalCapacity(

(File has more lines. Use 'offset' parameter to read beyond line 880)
</file>
```

---

## Assistant (Plan · claude-opus-4.5 · 23.1s)

Now I need to update the `getTerminalCapacityForDate` function to generate **virtual slots** for times that have no records. Let me edit this section:

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "newString": "/**\n * Get terminal capacity for a specific date\n * Returns ALL slots based on terminal operating hours, including virtual slots (no bookings yet)\n */\nexport async function getTerminalCapacityForDate(\n  ctx: QueryCtx,\n  terminalId: Id<\"terminals\">,\n  date: string\n): Promise<SlotCapacity[]> {\n  const terminal = await ctx.db.get(terminalId);\n  if (!terminal) return [];\n\n  // Get existing slot records for this date\n  const existingSlots = await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q => \n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .collect();\n\n  // Build map of existing slots by startTime\n  const slotMap = new Map(existingSlots.map(s => [s.startTime, s]));\n\n  // Generate all possible slots based on terminal operating hours\n  const results: SlotCapacity[] = [];\n  const startHour = parseInt(terminal.operatingHoursStart.split(\":\")[0], 10);\n  const endHour = parseInt(terminal.operatingHoursEnd.split(\":\")[0], 10);\n  const durationMinutes = terminal.slotDurationMinutes;\n\n  for (let hour = startHour; hour < endHour; hour++) {\n    for (let minute = 0; minute < 60; minute += durationMinutes) {\n      const startTime = `${hour.toString().padStart(2, \"0\")}:${minute.toString().padStart(2, \"0\")}`;\n      const endMinute = minute + durationMinutes;\n      const endHourActual = hour + Math.floor(endMinute / 60);\n      const endMinuteActual = endMinute % 60;\n      const endTime = `${endHourActual.toString().padStart(2, \"0\")}:${endMinuteActual.toString().padStart(2, \"0\")}`;\n\n      const existingSlot = slotMap.get(startTime);\n\n      if (existingSlot) {\n        // Real slot with bookings\n        const bookings = await ctx.db\n          .query(\"bookings\")\n          .withIndex(\"by_terminal_and_date\", q =>\n            q.eq(\"terminalId\", terminalId).eq(\"preferredDate\", date)\n          )\n          .filter(q => \n            q.and(\n              q.eq(q.field(\"preferredTimeStart\"), startTime),\n              q.or(\n                q.eq(q.field(\"status\"), \"pending\"),\n                q.eq(q.field(\"status\"), \"confirmed\")\n              )\n            )\n          )\n          .collect();\n\n        const autoValidatedCount = bookings.filter(b => b.wasAutoValidated).length;\n        const threshold = existingSlot.autoValidationThreshold ?? terminal.autoValidationThreshold;\n        const maxAutoValidated = Math.floor((existingSlot.maxCapacity * threshold) / 100);\n\n        results.push({\n          slotId: existingSlot._id,\n          date,\n          startTime,\n          endTime,\n          available: existingSlot.isActive \n            ? Math.max(0, existingSlot.maxCapacity - existingSlot.currentBookings)\n            : 0,\n          total: existingSlot.maxCapacity,\n          booked: existingSlot.currentBookings,\n          utilizationPercent: Math.round((existingSlot.currentBookings / existingSlot.maxCapacity) * 100),\n          autoValidationThreshold: threshold,\n          autoValidatedCount,\n          remainingAutoValidation: Math.max(0, maxAutoValidated - autoValidatedCount),\n          isVirtual: false,\n          isActive: existingSlot.isActive,\n        });\n      } else {\n        // Virtual slot (no bookings yet) - use terminal defaults\n        const threshold = terminal.autoValidationThreshold;\n        const maxAutoValidated = Math.floor((terminal.defaultSlotCapacity * threshold) / 100);\n\n        results.push({\n          slotId: undefined, // No record exists yet\n          date,\n          startTime,\n          endTime,\n          available: terminal.defaultSlotCapacity,\n          total: terminal.defaultSlotCapacity,\n          booked: 0,\n          utilizationPercent: 0,\n          autoValidationThreshold: threshold,\n          autoValidatedCount: 0,\n          remainingAutoValidation: maxAutoValidated,\n          isVirtual: true,  // Flag to indicate this is a computed slot\n          isActive: true,   // Virtual slots are always active\n        });\n      }\n    }\n  }\n\n  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));\n}",
  "oldString": "/**\n * Get terminal capacity for a specific date\n */\nexport async function getTerminalCapacityForDate(\n  ctx: QueryCtx,\n  terminalId: Id<\"terminals\">,\n  date: string\n): Promise<SlotCapacity[]> {\n  const terminal = await ctx.db.get(terminalId);\n  if (!terminal) return [];\n\n  const slots = await ctx.db\n    .query(\"timeSlots\")\n    .withIndex(\"by_terminal_and_date\", q => \n      q.eq(\"terminalId\", terminalId).eq(\"date\", date)\n    )\n    .collect();\n\n  const results: SlotCapacity[] = [];\n\n  for (const slot of slots) {\n    // Count auto-validated bookings for this slot\n    const bookings = await ctx.db\n      .query(\"bookings\")\n      .withIndex(\"by_terminal_and_date\", q =>\n        q.eq(\"terminalId\", terminalId).eq(\"preferredDate\", date)\n      )\n      .filter(q => \n        q.and(\n          q.eq(q.field(\"preferredTimeStart\"), slot.startTime),\n          q.or(\n            q.eq(q.field(\"status\"), \"pending\"),\n            q.eq(q.field(\"status\"), \"confirmed\")\n          )\n        )\n      )\n      .collect();\n\n    const autoValidatedCount = bookings.filter(b => b.wasAutoValidated).length;\n    const threshold = slot.autoValidationThreshold ?? terminal.autoValidationThreshold;\n    const maxAutoValidated = Math.floor((slot.maxCapacity * threshold) / 100);\n\n    results.push({\n      slotId: slot._id,\n      date: slot.date,\n      startTime: slot.startTime,\n      endTime: slot.endTime,\n      available: Math.max(0, slot.maxCapacity - slot.currentBookings),\n      total: slot.maxCapacity,\n      booked: slot.currentBookings,\n      utilizationPercent: Math.round((slot.currentBookings / slot.maxCapacity) * 100),\n      autoValidationThreshold: threshold,\n      autoValidatedCount,\n      remainingAutoValidation: Math.max(0, maxAutoValidated - autoValidatedCount),\n    });\n  }\n\n  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Plan · claude-opus-4.5 · 7.5s)

Now let me also update the `SlotCapacity` interface to include the new fields:

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/sones/projects/monorepo/.opencode/plans/1770398316992-lucky-meadow.md",
  "newString": "export interface SlotCapacity extends CapacityResult {\n  slotId?: Id<\"timeSlots\">;                       // undefined for virtual slots\n  date: string;\n  startTime: string;\n  endTime: string;\n  autoValidationThreshold: number;\n  autoValidatedCount: number;\n  remainingAutoValidation: number;\n  isVirtual: boolean;                             // true if no slot record exists yet\n  isActive: boolean;                              // false if slot was disabled by operator\n}",
  "oldString": "export interface SlotCapacity extends CapacityResult {\n  slotId: Id<\"timeSlots\">;\n  date: string;\n  startTime: string;\n  endTime: string;\n  autoValidationThreshold: number;\n  autoValidatedCount: number;\n  remainingAutoValidation: number;\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Plan · claude-opus-4.5 · 11.7s)

The plan now clearly explains the slot management model:

## Summary of Slot Management

**Configuration = Static, Instances = Dynamic**

1. **Terminal defines operating hours** (e.g., `operatingHoursStart: "00:00"`, `operatingHoursEnd: "23:00"`, `slotDurationMinutes: 60`)

2. **When querying availability** (`getTerminalCapacityForDate`):
   - Generates ALL 24 slots based on terminal config
   - For slots with no bookings yet → returns **virtual slots** with `isVirtual: true`, using terminal defaults
   - For slots with existing records → returns actual data

3. **When booking** (`checkAndReserveCapacity`):
   - If slot record doesn't exist → creates it on-demand with terminal defaults
   - Then increments `currentBookings`

This way:
- Querying an empty slot returns `0/capacity` (not "slot not found")
- No need to pre-create 168+ records per week
- Operators can still customize individual slots after they're created (e.g., disable a specific slot, change capacity)

Does this clarify the design? Would you like me to adjust anything else in the plan?

---

