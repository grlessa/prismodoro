# Prismodoro

A high-end monochrome Pomodoro timer with industrial minimalist design. Focus on deep work without the anxiety of traditional countdown timers.

**Slogan:** *"Estrutura para começar, liberdade para continuar."*

## Features

### Core Functionality

- **The Horizon Line**: A single horizontal progress bar that fills the screen, providing visual feedback without numbers
- **Two Focus Modes**:
  - **Classic Mode**: Traditional timer that plays an alarm when time reaches zero
  - **Prisma Mode (Flow)**: Seamlessly transitions to overtime tracking when time completes, allowing you to continue in flow state
- **Blind Mode**: Hide the timer numbers to reduce anxiety - only the Horizon Line remains visible
- **Smart Break System**: Dynamic, proportional break calculation based on focus time
  - Short breaks: 20% of focus time (e.g., 25min focus → 5min break)
  - Long breaks: 60% of focus time after 4 completed cycles
- **Break Mode**: Inverted visual (white background, black text) for mental phase shift during rest
- **Session Continuity**: After breaks, choose to continue with previous session settings or start a new one

### Design

- **Industrial Minimalist Aesthetic**: Strict monochrome palette
- **Focus Mode**: Pure black background (#000000) with white text
- **Break Mode**: Pure white background (#FFFFFF) with black text (phase inversion)
- **Neue Haas Display Font**: Custom typography throughout the entire application
- **Responsive Design**: Optimized for both desktop and mobile devices

## Installation

```bash
npm install
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

```tsx
import PrismodoroUI from './src/Component';

function App() {
  return (
    <div className="h-screen w-screen">
      <PrismodoroUI 
        defaultMinutes={25} 
        onFinish={(minutes) => console.log('Session finished:', minutes)} 
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultMinutes` | `number` | `25` | Default duration of the focus session in minutes. User can customize via UI. |
| `onFinish` | `(minutes: number) => void` | `undefined` | Callback fired when session is stopped/finished. Receives total minutes completed. |

## How It Works

### Focus Session Configuration

- **Preset Options**: 15min (Low), 25min (Medium), 50min (High)
- **Custom Time**: Slider to set any duration from 1 to 120 minutes
- **Mode Selection**: Choose between Classic (alarm on completion) or Prisma (flow state after completion)

### Break System

The break duration is calculated dynamically using proportional formulas:

- **Short Break**: `D = 0.2 × F` (20% of focus time)
  - Example: 25min focus → 5min break
  - Example: 30min focus → 6min break
  - Example: 50min focus → 10min break

- **Long Break**: `L = 0.6 × F` (60% of focus time, after 4 completed cycles)
  - Example: 25min focus → 15min break (after 4 cycles)

### Session Flow

1. **Setup**: Configure focus time and mode
2. **Focus**: Timer runs, user can enable blind mode to hide numbers
3. **Completion**:
   - Classic Mode: Alarm sounds, goes to summary
   - Prisma Mode: Transitions to flow state (overtime tracking)
4. **Summary**: Shows total focus time achieved
5. **Break**: Dynamic break timer with inverted visual (white screen)
6. **After Break**: Choose to continue with previous settings or configure a new session

## Technical Details

### Dependencies

- `react` & `react-dom`: UI framework
- `framer-motion`: Smooth animations and transitions
- `lucide-react`: Minimal icon set
- `tailwindcss`: Utility-first CSS framework
- `typescript`: Type safety

### Font

The application uses **Neue Haas Display Medium** (`NeueHaasDisplay-Mediu.woff2`) as the primary typeface throughout all interfaces.

### State Management

- Cycle counter resets on page reload (no persistence between sessions)
- Previous session configuration is saved when entering break mode
- All timer states are managed internally via React hooks

## Project Structure

```
Prismodoro/
├── src/
│   ├── Component.tsx      # Main Prismodoro component
│   ├── App.tsx            # App wrapper
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles and font definitions
├── public/
│   └── NeueHaasDisplay-Mediu.woff2  # Custom font file
├── CONTEXT.md             # Detailed concept documentation
└── README.md              # This file
```

## Philosophy

Prismodoro addresses two key failures of traditional productivity apps:

1. **Temporal Anxiety**: Countdown timers create stress. Solution: Visual progress (Horizon Line) and optional number hiding.
2. **Flow Interruption**: Alarms disrupt deep focus. Solution: Prisma Mode allows seamless continuation beyond the target time.

The goal is to eliminate friction to start work and protect focus once achieved.

## License

MIT
