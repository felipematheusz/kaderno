CREATE ROLE "kaderno_app";--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"apelido" text,
	"cpf" text,
	"telefone" text,
	"email" text,
	"endereco" text,
	"score" smallint,
	"desde" date DEFAULT current_date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_contaId_id_unique" UNIQUE("conta_id","id"),
	CONSTRAINT "clientes_score" CHECK ("clientes"."score" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"proximo_numero_contrato" integer DEFAULT 1 NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"produto" text,
	"custo" numeric(12, 2),
	"entrada" numeric(12, 2),
	"principal" numeric(12, 2) NOT NULL,
	"taxa" numeric(7, 4) NOT NULL,
	"juros_sobre" text NOT NULL,
	"frequencia" text NOT NULL,
	"juros_em_atraso" boolean DEFAULT false NOT NULL,
	"observacao" text,
	"criado_em" date DEFAULT current_date NOT NULL,
	"repassado_em" date,
	"canal_repasse" text,
	CONSTRAINT "contratos_contaId_id_unique" UNIQUE("conta_id","id"),
	CONSTRAINT "contratos_contaId_numero_unique" UNIQUE("conta_id","numero"),
	CONSTRAINT "contratos_tipo" CHECK ("contratos"."tipo" in ('emprestimo', 'venda')),
	CONSTRAINT "contratos_juros_sobre" CHECK ("contratos"."juros_sobre" in ('parcela', 'total')),
	CONSTRAINT "contratos_frequencia" CHECK ("contratos"."frequencia" in ('diaria', 'semanal', 'quinzenal', 'mensal')),
	CONSTRAINT "contratos_canal_repasse" CHECK ("contratos"."canal_repasse" in ('pix', 'dinheiro', 'transferencia', 'cartao')),
	CONSTRAINT "contratos_valores" CHECK ("contratos"."principal" > 0 and "contratos"."taxa" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "contratos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "eventos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"conta_id" uuid NOT NULL,
	"usuario_id" uuid,
	"origem" text NOT NULL,
	"operacao" text NOT NULL,
	"entrada" jsonb NOT NULL,
	"resultado" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventos_origem" CHECK ("eventos"."origem" in ('web', 'whatsapp', 'ia', 'sistema'))
);
--> statement-breakpoint
ALTER TABLE "eventos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "idempotencia" (
	"conta_id" uuid NOT NULL,
	"chave" text NOT NULL,
	"operacao" text NOT NULL,
	"resultado" jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotencia_conta_id_chave_pk" PRIMARY KEY("conta_id","chave")
);
--> statement-breakpoint
ALTER TABLE "idempotencia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "membros" (
	"conta_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"papel" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membros_conta_id_usuario_id_pk" PRIMARY KEY("conta_id","usuario_id"),
	CONSTRAINT "membros_papel" CHECK ("membros"."papel" in ('dono'))
);
--> statement-breakpoint
ALTER TABLE "membros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "parcelas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_id" uuid NOT NULL,
	"contrato_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"vencimento" date NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"pago" boolean DEFAULT false NOT NULL,
	"pago_em" date,
	"valor_recebido" numeric(12, 2),
	"detalhe" text,
	"observacao" text,
	"renegociada" boolean DEFAULT false NOT NULL,
	"recebimento_id" uuid,
	CONSTRAINT "parcelas_contaId_contratoId_numero_unique" UNIQUE("conta_id","contrato_id","numero"),
	CONSTRAINT "parcelas_valor" CHECK ("parcelas"."valor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "parcelas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recebimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_id" uuid NOT NULL,
	"contrato_id" uuid NOT NULL,
	"parcela_numero" integer NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"forma" text NOT NULL,
	"canal" text NOT NULL,
	"data" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recebimentos_contaId_id_unique" UNIQUE("conta_id","id"),
	CONSTRAINT "recebimentos_forma" CHECK ("recebimentos"."forma" in ('parcela', 'juros', 'parcial', 'quitacao')),
	CONSTRAINT "recebimentos_canal" CHECK ("recebimentos"."canal" in ('pix', 'dinheiro', 'transferencia', 'cartao')),
	CONSTRAINT "recebimentos_valor" CHECK ("recebimentos"."valor" > 0)
);
--> statement-breakpoint
ALTER TABLE "recebimentos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text,
	"avisos" jsonb DEFAULT '{"vencimentos":true,"atrasos":true,"resumo":false}'::jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_conta_id_cliente_id_clientes_conta_id_id_fk" FOREIGN KEY ("conta_id","cliente_id") REFERENCES "public"."clientes"("conta_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotencia" ADD CONSTRAINT "idempotencia_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membros" ADD CONSTRAINT "membros_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membros" ADD CONSTRAINT "membros_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_conta_id_contrato_id_contratos_conta_id_id_fk" FOREIGN KEY ("conta_id","contrato_id") REFERENCES "public"."contratos"("conta_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_conta_id_recebimento_id_recebimentos_conta_id_id_fk" FOREIGN KEY ("conta_id","recebimento_id") REFERENCES "public"."recebimentos"("conta_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimentos" ADD CONSTRAINT "recebimentos_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimentos" ADD CONSTRAINT "recebimentos_conta_id_contrato_id_contratos_conta_id_id_fk" FOREIGN KEY ("conta_id","contrato_id") REFERENCES "public"."contratos"("conta_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clientes_conta_id_nome_index" ON "clientes" USING btree ("conta_id","nome");--> statement-breakpoint
CREATE INDEX "contratos_conta_id_cliente_id_index" ON "contratos" USING btree ("conta_id","cliente_id");--> statement-breakpoint
CREATE INDEX "eventos_conta_id_criado_em_index" ON "eventos" USING btree ("conta_id","criado_em");--> statement-breakpoint
CREATE INDEX "eventos_usuario_id_index" ON "eventos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "membros_usuario_id_index" ON "membros" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "parcelas_conta_id_vencimento_index" ON "parcelas" USING btree ("conta_id","vencimento");--> statement-breakpoint
CREATE INDEX "recebimentos_conta_id_data_index" ON "recebimentos" USING btree ("conta_id","data");--> statement-breakpoint
CREATE POLICY "clientes: só a conta atual" ON "clientes" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "contas: só a conta atual" ON "contas" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (id = privado.conta_atual()) WITH CHECK (id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "contratos: só a conta atual" ON "contratos" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "eventos: só a conta atual" ON "eventos" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "idempotencia: só a conta atual" ON "idempotencia" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "membros: só a conta atual" ON "membros" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "parcelas: só a conta atual" ON "parcelas" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "recebimentos: só a conta atual" ON "recebimentos" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (conta_id = privado.conta_atual()) WITH CHECK (conta_id = privado.conta_atual());--> statement-breakpoint
CREATE POLICY "usuarios: só o próprio usuário" ON "usuarios" AS PERMISSIVE FOR ALL TO "kaderno_app" USING (id = privado.usuario_atual()) WITH CHECK (id = privado.usuario_atual());