# Desafio Fitness - Flexões & Corrida

Este é um aplicativo web interativo projetado para grupos de amigos que desejam disputar um desafio fitness de flexões de braço e corridas (quilometragem, tempo e ritmo/pace).

O projeto é construído em **HTML5, CSS3 moderno (Vanilla) e JavaScript (ES Modules)**, sem necessidade de ferramentas complexas de compilação ou Node.js local. Ele se conecta diretamente ao **Supabase** para sincronização em tempo real e é otimizado para implantação rápida e gratuita na **Vercel**.

---

## 🚀 Como Funciona o Aplicativo

1. **Visualização Pública**: Qualquer pessoa com o link pode acessar o painel de performance, acompanhar os rankings em tempo real e consultar o histórico de desafios anteriores.
2. **Área Administrativa Protegida**: Um painel administrativo oculto por senha permite que apenas o moderador cadastre participantes, inicie novos desafios e gerencie atividades.
3. **Lançamento de Atividades**: O administrador realiza os lançamentos de treinos (corridas e flexões) de todos os participantes. Por serem lançados pela administração, os treinos entram como validados de forma imediata.
4. **Ciclo de Desafios Dinâmico**: Ao final de um desafio, o administrador pode iniciar um novo diretamente pelo painel definindo datas de início e fim e metas específicas de quilometragem e repetições.

---

## 🛠️ Passo a Passo para Configuração

### 1. Criar o Banco de Dados no Supabase (Grátis)
1. Crie uma conta gratuita em [Supabase.com](https://supabase.com).
2. Clique em **New Project** e crie um novo banco de dados.
3. No menu esquerdo, clique em **SQL Editor**.
4. Clique em **New Query** e cole o seguinte script de criação de tabelas:

```sql
-- Tabela de Desafios
CREATE TABLE public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Participantes
CREATE TABLE public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Atividades
CREATE TABLE public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pushup', 'running')),
    amount NUMERIC NOT NULL,
    duration INTEGER, -- Em segundos
    pace NUMERIC,     -- Minutos por km
    validator_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Configurações Gerais
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Desativar RLS para permitir acesso público via API cliente
ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Habilitar atualizações em tempo real para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
```

5. Clique em **Run** no canto inferior direito para executar o script. Suas tabelas estarão prontas!

### 2. Conectar o Aplicativo ao Supabase
1. Ao abrir o aplicativo pela primeira vez, uma tela de configuração será exibida.
2. No painel do seu projeto do Supabase, acesse **Project Settings > API** (ícone de engrenagem no canto inferior esquerdo).
3. Copie o valor do campo **Project URL** e cole no campo correspondente no aplicativo.
4. Copie o valor da chave **anon public** (dentro de Project API keys) e cole no campo correspondente no aplicativo.
5. Clique em **Salvar e Conectar**. O aplicativo salvará estes dados localmente no navegador e você poderá começar a cadastrar participantes!

---

## 💻 Como Rodar e Testar Localmente

Se você não possui o Node.js instalado, pode rodar um servidor de testes de maneira super rápida usando o Python que já está presente na sua máquina:

1. Abra o terminal (PowerShell ou CMD) na pasta do projeto.
2. Execute o seguinte comando:
   ```bash
   python -m http.server 8000
   ```
3. Abra o seu navegador e acesse: `http://localhost:8000`.

---

## 📦 Hospedar Gratuitamente na Vercel

### Método 1: Integração com o GitHub (Recomendado)
1. Crie um repositório no seu GitHub e suba todos os arquivos do projeto (`index.html`, `styles.css`, `app.js`, `vercel.json` e a pasta `src/`).
2. Acesse [Vercel.com](https://vercel.com) e crie uma conta gratuita.
3. Clique em **Add New > Project** e importe o seu repositório do GitHub.
4. Clique em **Deploy**. A Vercel detectará o arquivo `vercel.json` e publicará o site como estático, fornecendo um link público seguro (com HTTPS) para compartilhar com seus amigos!

### Método 2: Usando a CLI da Vercel
1. Se você tiver a CLI da Vercel instalada, basta abrir o terminal na pasta do projeto e rodar:
   ```bash
   vercel
   ```
2. Siga as instruções no terminal para fazer o deploy imediato.
