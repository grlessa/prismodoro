# Prismodoro

Um timer Pomodoro monocromático de alta qualidade com design minimalista industrial. Foque em trabalho profundo sem a ansiedade dos cronômetros tradicionais.

**Slogan:** *"Estrutura para começar, liberdade para continuar."*

## Funcionalidades

### Funcionalidades Principais

- **A Linha do Horizonte**: Uma única barra de progresso horizontal que preenche a tela, fornecendo feedback visual sem números
- **Dois Modos de Foco**:
  - **Modo Clássico**: Timer tradicional que toca um alarme quando o tempo chega a zero
  - **Modo Prisma (Fluxo)**: Transiciona suavemente para rastreamento de tempo extra quando o tempo completa, permitindo que você continue no estado de fluxo
- **Modo Cego**: Oculte os números do timer para reduzir ansiedade - apenas a Linha do Horizonte permanece visível
- **Sistema de Descanso Inteligente**: Cálculo dinâmico e proporcional de descanso baseado no tempo de foco
  - Descansos curtos: 20% do tempo de foco (ex: 25min de foco → 5min de descanso)
  - Descansos longos: 60% do tempo de foco após 4 ciclos completados
- **Modo Descanso**: Visual invertido (fundo branco, texto preto) para mudança de fase mental durante o descanso
- **Continuidade de Sessão**: Após os descansos, escolha continuar com as configurações da sessão anterior ou iniciar uma nova

### Design

- **Estética Minimalista Industrial**: Paleta estritamente monocromática
- **Modo Foco**: Fundo preto absoluto (#000000) com texto branco
- **Modo Descanso**: Fundo branco absoluto (#FFFFFF) com texto preto (inversão de fase)
- **Fonte Neue Haas Display**: Tipografia personalizada em toda a aplicação
- **Design Responsivo**: Otimizado para dispositivos desktop e mobile

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build de produção
npm run preview
```

## Uso

```tsx
import PrismodoroUI from './src/Component';

function App() {
  return (
    <div className="h-screen w-screen">
      <PrismodoroUI 
        defaultMinutes={25} 
        onFinish={(minutes) => console.log('Sessão finalizada:', minutes)} 
      />
    </div>
  );
}
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `defaultMinutes` | `number` | `25` | Duração padrão da sessão de foco em minutos. O usuário pode personalizar via interface. |
| `onFinish` | `(minutes: number) => void` | `undefined` | Callback disparado quando a sessão é parada/finalizada. Recebe o total de minutos completados. |

## Como Funciona

### Configuração da Sessão de Foco

- **Opções Predefinidas**: 15min (Baixo), 25min (Médio), 50min (Alto)
- **Tempo Personalizado**: Slider para definir qualquer duração de 1 a 120 minutos
- **Seleção de Modo**: Escolha entre Clássico (alarme ao completar) ou Prisma (estado de fluxo após completar)

### Sistema de Descanso

A duração do descanso é calculada dinamicamente usando fórmulas proporcionais:

- **Descanso Curto**: `D = 0.2 × F` (20% do tempo de foco)
  - Exemplo: 25min de foco → 5min de descanso
  - Exemplo: 30min de foco → 6min de descanso
  - Exemplo: 50min de foco → 10min de descanso

- **Descanso Longo**: `L = 0.6 × F` (60% do tempo de foco, após 4 ciclos completados)
  - Exemplo: 25min de foco → 15min de descanso (após 4 ciclos)

### Fluxo da Sessão

1. **Configuração**: Configure o tempo de foco e o modo
2. **Foco**: Timer roda, usuário pode ativar modo cego para ocultar números
3. **Conclusão**:
   - Modo Clássico: Alarme toca, vai para resumo
   - Modo Prisma: Transiciona para estado de fluxo (rastreamento de tempo extra)
4. **Resumo**: Mostra o tempo total de foco alcançado
5. **Descanso**: Timer de descanso dinâmico com visual invertido (tela branca)
6. **Após Descanso**: Escolha continuar com as configurações anteriores ou configurar uma nova sessão

## Detalhes Técnicos

### Dependências

- `react` & `react-dom`: Framework de UI
- `framer-motion`: Animações e transições suaves
- `lucide-react`: Conjunto de ícones minimalistas
- `tailwindcss`: Framework CSS utility-first
- `typescript`: Segurança de tipos

### Fonte

A aplicação usa **Neue Haas Display Medium** (`NeueHaasDisplay-Mediu.woff2`) como a tipografia principal em todas as interfaces.

### Gerenciamento de Estado

- Contador de ciclos reseta ao recarregar a página (sem persistência entre sessões)
- Configuração da sessão anterior é salva ao entrar no modo descanso
- Todos os estados do timer são gerenciados internamente via React hooks

## Estrutura do Projeto

```
Prismodoro/
├── src/
│   ├── Component.tsx      # Componente principal do Prismodoro
│   ├── App.tsx            # Wrapper da aplicação
│   ├── main.tsx           # Ponto de entrada
│   └── index.css          # Estilos globais e definições de fonte
├── public/
│   └── NeueHaasDisplay-Mediu.woff2  # Arquivo de fonte personalizada
├── CONTEXT.md             # Documentação detalhada do conceito
└── README.md              # Este arquivo
```

## Filosofia

O Prismodoro aborda duas falhas principais dos apps de produtividade tradicionais:

1. **Ansiedade Temporal**: Cronômetros regressivos criam estresse. Solução: Progresso visual (Linha do Horizonte) e ocultação opcional de números.
2. **Interrupção do Fluxo**: Alarmes interrompem o foco profundo. Solução: Modo Prisma permite continuação suave além do tempo alvo.

O objetivo é eliminar o atrito para começar o trabalho e proteger o foco uma vez alcançado.

## Licença

MIT
