# Lynku.id Layout Structure Plan

## Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (Full Width) - White bg with border-bottom                  │
│ Logo + Title "My Bio Link" | Search | Share Url Button             │
└─────────────────────────────────────────────────────────────────────┘
├──────────────────┬──────────────────────────────┬────────────────────┤
│ Left Sidebar     │ Center Content              │ Right Preview      │
│ (256px)          │ (Flex-1)                    │ (400px)            │
│                  │                              │                    │
│ • Home           │ ┌─Profile Card──────────┐  │ ┌──────────────┐  │
│ • My Bio Link    │ │ Avatar + Name         │  │ │              │  │
│ • Orders         │ │ Contact + WA Group    │  │ │  Smartphone  │  │
│ • My Purchase    │ └───────────────────────┘  │ │   Preview    │  │
│                  │                              │ │              │  │
│ [Products]       │ ┌─Tabs─────────────────┐   │ │  Live Bio    │  │
│ • Course Video   │ │ Lynk│Appearance│Stat │   │ │   Preview    │  │
│ • Digital        │ └───────────────────────┘  │ │              │  │
│ • Event          │                              │ │              │  │
│                  │ ┌─Block List────────────┐  │ │              │  │
│                  │ │ ⋮ Visit my website    │  │ │              │  │
│                  │ │ ⋮ Product - Harmonica │  │ └──────────────┘  │
│                  │ │ ⋮ Instagram Link      │  │                    │
│                  │ │ + Add New Block       │  │                    │
│                  │ └───────────────────────┘  │                    │
└──────────────────┴──────────────────────────────┴────────────────────┘
```

## Implementation Steps
1. Remove ResponsivePageWrapper
2. Create fixed 3-column grid layout
3. Add Tabs for Lynk/Appearance/Statistic
4. Style block list with drag handles (GripVertical icon)
5. Create sticky smartphone preview
6. Match color scheme (Purple gradient theme)
