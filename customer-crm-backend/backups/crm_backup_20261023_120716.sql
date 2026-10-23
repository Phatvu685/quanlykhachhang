--
-- PostgreSQL database dump
--

\restrict 7pJD2lp0vtcijqzbgiQ0KodZVlhngb0JS6PkEemCOmyU0H7q6EVPcaekqkU8zwr

-- Dumped from database version 18.6 (fd34222)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.stock_entries DROP CONSTRAINT IF EXISTS "stock_entries_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS "expenses_stockEntryId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_stockEntryId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_staffUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_giftStockEntryId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_giftProductId_fkey";
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS "customers_comboId_fkey";
ALTER TABLE IF EXISTS ONLY public.combos DROP CONSTRAINT IF EXISTS "combos_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.combos DROP CONSTRAINT IF EXISTS "combos_giftProductId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_inviterId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS "account_userId_fkey";
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public."stock_entries_productId_idx";
DROP INDEX IF EXISTS public."expenses_stockEntryId_key";
DROP INDEX IF EXISTS public."customers_stockEntryId_key";
DROP INDEX IF EXISTS public.customers_stage_idx;
DROP INDEX IF EXISTS public."customers_staffUserId_idx";
DROP INDEX IF EXISTS public."customers_giftStockEntryId_key";
DROP INDEX IF EXISTS neon_auth.verification_identifier_idx;
DROP INDEX IF EXISTS neon_auth."session_userId_idx";
DROP INDEX IF EXISTS neon_auth.organization_slug_uidx;
DROP INDEX IF EXISTS neon_auth."member_userId_idx";
DROP INDEX IF EXISTS neon_auth."member_organizationId_idx";
DROP INDEX IF EXISTS neon_auth."invitation_organizationId_idx";
DROP INDEX IF EXISTS neon_auth.invitation_email_idx;
DROP INDEX IF EXISTS neon_auth."account_userId_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_entries DROP CONSTRAINT IF EXISTS stock_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.combos DROP CONSTRAINT IF EXISTS combos_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.verification DROP CONSTRAINT IF EXISTS verification_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_email_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_token_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_endpoint_id_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_slug_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS member_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.jwks DROP CONSTRAINT IF EXISTS jwks_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS invitation_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS account_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.social_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.combos ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.stock_entries_id_seq;
DROP TABLE IF EXISTS public.stock_entries;
DROP SEQUENCE IF EXISTS public.social_accounts_id_seq;
DROP TABLE IF EXISTS public.social_accounts;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.expenses_id_seq;
DROP TABLE IF EXISTS public.expenses;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.combos_id_seq;
DROP TABLE IF EXISTS public.combos;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS neon_auth.verification;
DROP TABLE IF EXISTS neon_auth."user";
DROP TABLE IF EXISTS neon_auth.session;
DROP TABLE IF EXISTS neon_auth.project_config;
DROP TABLE IF EXISTS neon_auth.organization;
DROP TABLE IF EXISTS neon_auth.member;
DROP TABLE IF EXISTS neon_auth.jwks;
DROP TABLE IF EXISTS neon_auth.invitation;
DROP TABLE IF EXISTS neon_auth.account;
DROP TYPE IF EXISTS public."StockType";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."PaymentStatus";
DROP TYPE IF EXISTS public."OfferType";
DROP TYPE IF EXISTS public."ExpenseKind";
DROP TYPE IF EXISTS public."CustomerType";
DROP TYPE IF EXISTS public."CustomerStage";
-- *not* dropping schema, since initdb creates it
DROP SCHEMA IF EXISTS neon_auth;
--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neon_auth;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CustomerStage; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CustomerStage" AS ENUM (
    'order',
    'cskh'
);


ALTER TYPE public."CustomerStage" OWNER TO neondb_owner;

--
-- Name: CustomerType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CustomerType" AS ENUM (
    'moi',
    'cu',
    'tiemnang'
);


ALTER TYPE public."CustomerType" OWNER TO neondb_owner;

--
-- Name: ExpenseKind; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ExpenseKind" AS ENUM (
    'chi_phi',
    'von',
    'hoan_von'
);


ALTER TYPE public."ExpenseKind" OWNER TO neondb_owner;

--
-- Name: OfferType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OfferType" AS ENUM (
    'percent',
    'money',
    'kg'
);


ALTER TYPE public."OfferType" OWNER TO neondb_owner;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'da_tra',
    'chua_tra'
);


ALTER TYPE public."PaymentStatus" OWNER TO neondb_owner;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Role" AS ENUM (
    'admin',
    'staff'
);


ALTER TYPE public."Role" OWNER TO neondb_owner;

--
-- Name: StockType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."StockType" AS ENUM (
    'nhap',
    'xuat'
);


ALTER TYPE public."StockType" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.account OWNER TO neon_auth;

--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


ALTER TABLE neon_auth.invitation OWNER TO neon_auth;

--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    alg text,
    crv text
);


ALTER TABLE neon_auth.jwks OWNER TO neon_auth;

--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.member OWNER TO neon_auth;

--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


ALTER TABLE neon_auth.organization OWNER TO neon_auth;

--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


ALTER TABLE neon_auth.project_config OWNER TO neon_auth;

--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


ALTER TABLE neon_auth.session OWNER TO neon_auth;

--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


ALTER TABLE neon_auth."user" OWNER TO neon_auth;

--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE neon_auth.verification OWNER TO neon_auth;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Name: combos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.combos (
    id integer NOT NULL,
    name text NOT NULL,
    "desc" text,
    "productId" integer,
    "productName" text,
    unit text DEFAULT 'kg'::text NOT NULL,
    "baseKg" numeric(12,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(14,2) DEFAULT 0 NOT NULL,
    "offerType" public."OfferType" DEFAULT 'percent'::public."OfferType" NOT NULL,
    "offerValue" numeric(14,2) DEFAULT 0 NOT NULL,
    "giftProductId" integer,
    "giftQty" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.combos OWNER TO neondb_owner;

--
-- Name: combos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.combos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.combos_id_seq OWNER TO neondb_owner;

--
-- Name: combos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.combos_id_seq OWNED BY public.combos.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text,
    type public."CustomerType" DEFAULT 'moi'::public."CustomerType" NOT NULL,
    note text,
    kg numeric(12,2) DEFAULT 0 NOT NULL,
    price numeric(14,2) DEFAULT 0 NOT NULL,
    "comboId" integer,
    "staffUserId" integer,
    "productId" integer,
    "stockEntryId" integer,
    "giftProductId" integer,
    "giftStockEntryId" integer,
    stage public."CustomerStage" DEFAULT 'order'::public."CustomerStage" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'da_tra'::public."PaymentStatus" NOT NULL,
    packed boolean DEFAULT false NOT NULL,
    delivered boolean DEFAULT false NOT NULL,
    "acquiredDate" text,
    "lastOrderDate" text,
    "deliveryDate" text,
    "nextContactDate" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    kind public."ExpenseKind" NOT NULL,
    name text NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    date text,
    note text,
    "autoStock" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "stockEntryId" integer
);


ALTER TABLE public.expenses OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    unit text DEFAULT 'kg'::text NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    "sellPrice" numeric(14,2) DEFAULT 0 NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.social_accounts (
    id integer NOT NULL,
    resource text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.social_accounts OWNER TO neondb_owner;

--
-- Name: social_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.social_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_accounts_id_seq OWNER TO neondb_owner;

--
-- Name: social_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.social_accounts_id_seq OWNED BY public.social_accounts.id;


--
-- Name: stock_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_entries (
    id integer NOT NULL,
    type public."StockType" NOT NULL,
    "productId" integer NOT NULL,
    qty numeric(12,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(14,2) DEFAULT 0 NOT NULL,
    supplier text,
    date text,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stock_entries OWNER TO neondb_owner;

--
-- Name: stock_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_entries_id_seq OWNER TO neondb_owner;

--
-- Name: stock_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_entries_id_seq OWNED BY public.stock_entries.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'staff'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: combos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combos ALTER COLUMN id SET DEFAULT nextval('public.combos_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: social_accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.social_accounts ALTER COLUMN id SET DEFAULT nextval('public.social_accounts_id_seq'::regclass);


--
-- Name: stock_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_entries ALTER COLUMN id SET DEFAULT nextval('public.stock_entries_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt", alg, crv) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
bb7b13cd-33fb-4b31-b63c-61fb1c66494d	customer-crm	ep-red-thunder-az9rzf6y	2026-08-09 14:50:17.353+00	2026-08-09 14:50:17.353+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b5bdb1d9-a77b-46bc-85ce-d5822b4bc580	d5ed711577a36836accb721551f37ad8addebb99869b911e419c6a27fffabdf6	2026-08-12 11:21:32.886881+00	20260812112132_init	\N	\N	2026-08-12 11:21:32.553505+00	1
\.


--
-- Data for Name: combos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.combos (id, name, "desc", "productId", "productName", unit, "baseKg", "unitPrice", "offerType", "offerValue", "giftProductId", "giftQty", "createdAt", "updatedAt") FROM stdin;
1	[HCM] COMBO 5KG ST25 THƯỜNG		2	\N	kg	5.00	32000.00	money	11000.00	\N	0.00	2026-08-18 06:48:13.755	2026-08-18 06:48:13.755
3	[HCM] ƯU ĐÃI 1KG ST25 THƯỜNG		2	\N	kg	1.00	32000.00	money	2000.00	\N	0.00	2026-08-18 06:50:28.909	2026-08-18 06:50:28.909
4	[HCM] ƯU ĐÃI 1KG ST25 NGUYÊN CÁM		3	\N	kg	1.00	37000.00	money	2000.00	\N	0.00	2026-08-18 06:51:25.783	2026-08-18 06:51:25.783
5	[HCM] COMBO 10KG ST25 NGUYÊN CÁM		3	\N	kg	10.00	37000.00	kg	1.00	3	0.00	2026-08-18 06:53:17.388	2026-08-18 06:53:17.388
7	[TỈNH] COMBO 5KG ST25 THƯỜNG	Combo 5kg = 149k - 13k (ship) = 136k\n15k Ship KH chịu	2	\N	kg	5.00	32000.00	money	24000.00	\N	0.00	2026-08-28 01:41:22.033	2026-08-28 01:41:22.033
8	[TỈNH] COMBO 10KG ST25 THƯỜNG	Combo 10kg = 290k - 13k (ship) = 277k\n15k Ship KH chịu	2	\N	kg	10.00	32000.00	money	43000.00	\N	0.00	2026-08-28 01:43:58.805	2026-08-28 01:43:58.805
2	[HCM] COMBO 10KG ST25 THƯỜNG		2	\N	kg	10.00	32000.00	money	30000.00	\N	0.00	2026-08-18 06:49:23.616	2026-08-28 01:48:27.504
9	[TỈNH] COMBO 5KG ST25 NGUYÊN CÁM	Combo 5Kg = 175k - 13k (Ship) = 162k\n15k Ship KH chịu	3	\N	kg	5.00	37000.00	money	23000.00	\N	0.00	2026-08-28 01:53:32.778	2026-08-28 01:53:32.778
10	[TỈNH] COMBO 10KG ST25 NGUYÊN CÁM	Combo 10Kg = 350k - 13k (Ship) = 337k\n15k Ship KH chịu	3	\N	kg	10.00	37000.00	money	33000.00	3	1.00	2026-08-28 01:55:35.572	2026-08-28 01:57:06.116
11	[TỈNH] COMBO 10KG ST25 THƯỜNG	FREESHIP	2	\N	kg	10.00	32000.00	money	30000.00	\N	0.00	2026-08-28 02:00:06.623	2026-08-28 02:00:06.623
12	[TỈNH] COMBO 10KG ST25 NGUYÊN CÁM	FREESHIP	3	\N	kg	10.00	37000.00	money	20000.00	\N	0.00	2026-08-28 02:01:10.057	2026-08-28 02:01:10.057
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, phone, address, type, note, kg, price, "comboId", "staffUserId", "productId", "stockEntryId", "giftProductId", "giftStockEntryId", stage, "paymentStatus", packed, delivered, "acquiredDate", "lastOrderDate", "deliveryDate", "nextContactDate", "createdAt", "updatedAt") FROM stdin;
48	Thịnh		MISA	moi		5.00	160000.00	\N	3	2	52	\N	\N	order	da_tra	t	t	2026-07-20	2026-07-20	\N	\N	2026-08-19 03:03:14.532	2026-08-19 03:03:24.219
33	TRƯƠNG LY		THỦ ĐỨC	moi		5.00	160000.00	\N	2	2	37	\N	\N	order	da_tra	t	t	2026-07-11	\N	\N	\N	2026-08-18 08:03:56.82	2026-08-18 08:04:05.19
61	Cô Duyên	0989015881	157/2 Hồ Văn Huê P9 Phú Nhuận	moi		5.00	175000.00	\N	2	3	64	\N	\N	order	da_tra	t	t	2026-07-30	2026-07-30	\N	\N	2026-08-19 03:33:45.032	2026-08-19 06:43:26.726
32	HOÀI NHUẬN		TÂN BÌNH	moi		6.00	160000.00	\N	3	2	36	\N	\N	order	da_tra	t	t	2026-07-11	\N	\N	\N	2026-08-18 08:03:19.37	2026-08-19 07:10:02.391
22	CHỊ TRÂN		MISA	moi		6.00	160000.00	\N	3	2	26	\N	\N	order	da_tra	t	t	2026-07-08	\N	\N	\N	2026-08-18 07:58:12.416	2026-08-19 07:09:03.22
19	HOÀI THƯ		107, Nguyễn Duy Cung, Gò Vấp	moi		6.00	160000.00	\N	3	2	23	\N	\N	order	da_tra	t	t	2026-07-05	\N	\N	\N	2026-08-18 07:56:10.757	2026-08-19 06:14:48.412
49	Thương		Gò Vấp	moi		1.00	32000.00	\N	3	2	53	\N	\N	order	da_tra	t	t	2026-07-22	2026-07-22	\N	\N	2026-08-19 03:03:49.179	2026-08-19 03:03:55.762
11	QUỲNH		MISA	moi		2.00	64000.00	\N	3	2	16	\N	\N	order	da_tra	t	t	2026-07-03	\N	\N	\N	2026-08-18 07:48:40.942	2026-08-18 07:48:48.305
41	Ái Thi		Gò Vấp	moi		1.00	32000.00	\N	4	2	45	\N	\N	order	da_tra	t	t	2026-07-15	2026-07-15	\N	\N	2026-08-19 02:55:29.296	2026-08-19 06:20:03.495
23	CHỊ VÂN ANH		MISA	moi		15.00	480000.00	\N	3	2	27	\N	\N	order	da_tra	t	t	2026-07-09	\N	\N	\N	2026-08-18 07:58:40.312	2026-08-18 07:58:52.253
12	TRANG		MISA	moi		5.00	160000.00	\N	3	2	17	\N	\N	order	da_tra	t	t	2026-07-03	\N	\N	\N	2026-08-18 07:49:55.026	2026-08-18 07:50:03.371
50	Phát		Gò Vấp	moi		1.00	32000.00	\N	5	2	54	\N	\N	order	da_tra	t	t	2026-07-23	2026-07-23	\N	\N	2026-08-19 03:04:17.975	2026-08-19 03:04:27.314
10	GẤU		THỦ ĐỨC	moi		6.00	160000.00	\N	4	2	15	\N	\N	order	da_tra	t	t	2026-07-01	\N	\N	\N	2026-08-18 07:47:41.055	2026-08-19 07:08:20.344
51	Hiền		MISA	cu		5.00	160000.00	\N	3	2	55	\N	\N	order	da_tra	t	t	2026-07-25	2026-07-25	\N	\N	2026-08-19 03:05:02.697	2026-08-19 03:05:16.041
9	NGỌC SANG		THỦ ĐỨC	moi		6.00	160000.00	\N	4	2	14	\N	\N	order	da_tra	t	t	2026-07-01	\N	\N	\N	2026-08-18 07:46:23.366	2026-08-19 07:07:06.665
24	QUỲNH NHI		NDK	moi		2.00	64000.00	\N	2	2	28	\N	\N	order	da_tra	t	t	2026-07-09	\N	\N	\N	2026-08-18 07:59:18.759	2026-08-18 07:59:25.925
16	QUỲNH		MISA	cu		5.00	160000.00	\N	3	2	20	\N	\N	order	da_tra	t	t	2026-07-03	\N	\N	\N	2026-08-18 07:52:55.333	2026-08-18 07:53:26.213
53	Chị Tiên	0782739688	89 Đ. Sô 48, Hiệp Bình Chánh, Thủ Đức, Thành phố Hồ Chí Minh	cu	Thêm 10Kg	10.00	320000.00	\N	3	2	57	\N	\N	order	da_tra	t	t	2026-07-25	2026-07-25	\N	\N	2026-08-19 03:06:28.719	2026-08-19 03:06:43.093
17	TRÚC		MISA	moi		5.00	160000.00	\N	3	2	21	\N	\N	order	da_tra	t	t	2026-07-03	\N	\N	\N	2026-08-18 07:54:01.414	2026-08-18 07:54:09.303
45	Chị Vy		MISA	moi		6.00	160000.00	\N	3	2	49	\N	\N	order	da_tra	t	t	2026-07-20	2026-07-20	\N	\N	2026-08-19 03:01:29.498	2026-08-19 07:10:48.475
40	Vương		Thủ Đức	moi		5.00	160000.00	\N	5	2	44	\N	\N	order	da_tra	t	t	2026-07-14	2026-07-14	\N	\N	2026-08-19 02:54:48.795	2026-08-19 02:54:58.315
18	CHỊ PÉ SỬU		MISA	moi		5.00	160000.00	\N	3	2	22	\N	\N	order	da_tra	t	t	2026-07-03	\N	\N	\N	2026-08-18 07:54:37.517	2026-08-18 07:54:47.082
25	CHỊ CẦM		MISA	moi		5.00	160000.00	\N	3	2	29	\N	\N	order	da_tra	t	t	2026-07-09	\N	\N	\N	2026-08-18 07:59:50.582	2026-08-18 07:59:57.139
59	Cô Tuyết		Gò Vấp	moi		5.00	150000.00	\N	4	2	62	\N	\N	order	da_tra	t	t	2026-07-30	2026-07-30	\N	\N	2026-08-19 03:12:06.121	2026-08-19 03:12:13.123
54	Tony Lâm		Bình Chánh	moi		5.00	150000.00	\N	3	2	58	\N	\N	order	da_tra	t	t	2026-07-25	2026-07-25	\N	\N	2026-08-19 03:07:18.292	2026-08-19 03:07:29.609
125	Chị Tuyền	0767381436	1033/2 nguyễn ảnh hữu, trung mỹ tây	moi		5.00	149000.00	\N	5	2	131	\N	\N	order	da_tra	t	t	2026-08-24	2026-08-24	\N	\N	2026-08-24 08:48:06.006	2026-08-26 02:19:06.515
20	TRÂN		MISA	moi		2.00	64000.00	\N	3	2	24	\N	\N	order	da_tra	t	t	2026-07-05	\N	\N	\N	2026-08-18 07:56:47.338	2026-08-18 07:56:57.75
21	MAI HUẾ		BÌNH TÂN	moi		2.00	64000.00	\N	4	2	25	\N	\N	order	da_tra	t	t	2026-07-07	\N	\N	\N	2026-08-18 07:57:42.95	2026-08-18 07:57:53.818
26	CHỊ NGA		MISA	moi		5.00	160000.00	\N	2	2	30	\N	\N	order	da_tra	t	t	2026-07-09	\N	\N	\N	2026-08-18 08:00:21.989	2026-08-18 08:00:28.684
56	Anh Lập		Gò Vấp	cu	Tặng ngoài chương trình	1.00	32000.00	\N	3	2	60	\N	\N	order	da_tra	t	t	2026-07-27	2026-07-27	\N	\N	2026-08-19 03:08:46.665	2026-08-19 03:08:57.123
27	THÚY DUY		MISA	moi		5.00	160000.00	\N	3	2	31	\N	\N	order	da_tra	t	t	2026-07-10	\N	\N	\N	2026-08-18 08:00:49.045	2026-08-18 08:00:56.367
57	AISA		MISA	moi		5.00	150000.00	\N	3	2	61	\N	\N	order	da_tra	t	t	2026-07-27	2026-07-27	\N	\N	2026-08-19 03:09:36.114	2026-08-19 03:09:47.309
28	CHỊ HÂN		MISA	moi		5.00	160000.00	\N	3	2	32	\N	\N	order	da_tra	t	t	2026-07-10	\N	\N	\N	2026-08-18 08:01:16.505	2026-08-18 08:01:24.565
34	Chị Hạnh	0902513906	110/20/41, Số 30, Phường 06, Gò Vấp cũ	moi		10.00	299000.00	\N	2	2	38	\N	\N	order	da_tra	t	t	2026-08-18	\N	\N	\N	2026-08-18 08:06:56.586	2026-08-19 01:41:01.014
29	NGỌC ANH		Q1	moi		5.00	160000.00	\N	4	2	33	\N	\N	order	da_tra	t	t	2026-07-10	\N	\N	\N	2026-08-18 08:01:51.522	2026-08-18 08:02:00.164
55	Anh Lập		Gò Vấp	moi		5.00	150000.00	\N	3	2	59	\N	\N	order	da_tra	t	t	2026-07-27	2026-07-27	\N	\N	2026-08-19 03:07:59.266	2026-08-19 03:10:03.553
30	CHỊ QUYÊN		MISA	moi		5.00	160000.00	\N	3	2	34	\N	\N	order	da_tra	t	t	2026-07-10	\N	\N	\N	2026-08-18 08:02:22.78	2026-08-18 08:02:30.019
31	HÂN		CỦ CHI	moi		10.00	320000.00	\N	5	2	35	\N	\N	order	da_tra	t	t	2026-07-11	\N	\N	\N	2026-08-18 08:02:50.87	2026-08-18 08:02:57.9
60	Mai Thy		Thủ Đức	moi		5.00	150000.00	\N	3	2	63	\N	\N	order	da_tra	t	t	2026-07-30	2026-07-30	\N	\N	2026-08-19 03:12:40.185	2026-08-19 03:12:53.445
37	Cô Lan		Gò Vấp	moi		5.00	160000.00	\N	5	2	41	\N	\N	order	da_tra	t	t	2026-07-12	\N	\N	\N	2026-08-19 02:49:24.637	2026-08-19 02:49:51.297
62	A Giang		Q12	moi		5.00	150000.00	\N	3	2	65	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:36:26.399	2026-08-19 03:36:35.675
38	Anh Bảo		Bình Tân	moi		5.00	160000.00	\N	3	2	42	\N	\N	order	da_tra	t	t	2026-07-12	2026-07-12	\N	\N	2026-08-19 02:50:47.16	2026-08-19 02:50:57.706
39	Trâm		Bình Tân	moi		2.00	64000.00	\N	3	2	43	\N	\N	order	da_tra	t	t	2026-07-14	2026-07-14	\N	\N	2026-08-19 02:51:39.866	2026-08-19 02:51:47.156
63	Cô Hằng		Bình Thạnh	cu		20.00	700000.00	\N	3	3	66	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:37:24.075	2026-08-19 03:37:40.18
52	Cô Hằng		Bình Thạnh	moi		5.00	160000.00	\N	3	2	56	\N	\N	order	da_tra	t	t	2026-07-25	2026-07-25	\N	\N	2026-08-19 03:05:37.923	2026-08-19 03:38:03.662
64	Tony Lâm		Bình Chánh	cu		5.00	175000.00	\N	3	3	67	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:38:33.69	2026-08-19 03:38:52.847
65	Chú Sinh	0907636556	80/47/21 Hoàng Hoa Thám phường Gia Định tp HCM	moi		5.00	150000.00	\N	3	2	68	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:40:58.445	2026-08-19 03:41:26.288
44	Chị Tào		MISA	moi		2.00	64000.00	\N	3	2	48	\N	\N	order	da_tra	t	t	2026-07-17	2026-07-17	\N	\N	2026-08-19 03:00:36.165	2026-08-19 03:00:45.625
43	Chị Tiên	0782739688	89 Đ. Sô 48, Hiệp Bình Chánh, Thủ Đức, Thành phố Hồ Chí Minh	moi	Thu trước tiền 5Kg	5.00	160000.00	\N	3	2	47	\N	\N	order	da_tra	t	t	2026-07-16	2026-07-16	\N	\N	2026-08-19 02:59:52.111	2026-08-19 03:00:52.186
46	Hiền		MISA	moi		1.00	32000.00	\N	3	2	50	\N	\N	order	da_tra	t	t	2026-07-20	2026-07-20	\N	\N	2026-08-19 03:02:06.106	2026-08-19 03:02:14.749
47	Như		MISA	moi		5.00	160000.00	\N	3	2	51	\N	\N	order	da_tra	t	t	2026-07-20	2026-07-20	\N	\N	2026-08-19 03:02:45.986	2026-08-19 03:02:53.122
66	Diệu Thạnh	0907639482	273/22 đường Nguyễn Văn Đậu, Phường Bình Lợi Trung (P11) Tôn Tước	moi		10.00	300000.00	\N	3	2	69	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:42:09.714	2026-08-19 03:42:43.256
67	Dung Nguyen	0902799730	nhà 67/3 điện biên phủ phường đa Kao quận 1	moi		5.00	150000.00	\N	3	2	70	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:43:21.238	2026-08-19 03:43:29.991
92	Chú Hướng	0903 837 119	29/1 NGUYỄN THÀNH PHƯƠNG,P. TRẤN BIÊN,TP.ĐÔNG NAI	moi		5.00	175000.00	\N	5	3	94	\N	\N	order	da_tra	t	t	2026-08-15	2026-08-15	\N	\N	2026-08-19 04:38:59.258	2026-08-19 04:39:10.31
68	Mai Le		Thủ Đức	moi		5.00	150000.00	\N	4	2	71	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:44:03.696	2026-08-19 03:44:12.712
78	Trân		MISA	moi		3.00	96000.00	\N	3	2	81	\N	\N	order	da_tra	t	t	2026-08-06	2026-08-06	\N	\N	2026-08-19 04:16:33.751	2026-08-19 04:17:01.912
69	Gấu		Thủ Đức	moi		5.00	160000.00	\N	4	2	72	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:44:33.909	2026-08-19 03:44:53.271
128	Chị Hoa	0372575988	khu Đồng Ông , x Đan Phượng  ,HN	moi		8.00	267000.00	\N	3	3	134	\N	\N	order	da_tra	t	t	2026-08-27	2026-08-27	\N	\N	2026-08-27 12:46:36.392	2026-09-03 14:40:10.838
79	Nguyễn Hồng Mai	0704588973	580 Nguyễn Văn Công p 3 gò vấp TP HCM.	moi		11.00	320000.00	\N	2	2	122	\N	\N	order	da_tra	t	t	2026-08-06	2026-08-06	\N	\N	2026-08-19 04:18:08.604	2026-08-19 08:01:41.78
85	Anh Nhựt	0939649998	528D Nguyễn Sinh Sắc, khóm Cầu Đình, phường Sa Đéc, tỉnh Đồng Tháp.	moi		5.00	172000.00	\N	4	3	87	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:28:58.313	2026-08-19 04:29:07.387
71	Phát		Gò Vấp	moi		5.00	175000.00	\N	5	3	74	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:46:19.252	2026-08-19 03:46:29.783
72	Như Hảo		Thủ Đức	moi		2.00	64000.00	\N	3	2	75	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:47:07.955	2026-08-19 03:47:37.146
82	NGỌC ANH		Q1	cu		45.00	1280000.00	\N	4	2	84	\N	\N	order	da_tra	t	t	2026-08-07	2026-08-07	\N	\N	2026-08-19 04:25:18.034	2026-08-19 06:07:34.04
73	Lê Văn Nhật	0358026848	F12LUCASTA liên phường, phú hữu, thủ đức, hcm	moi		30.00	897000.00	\N	4	2	76	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:49:39.288	2026-08-19 03:49:47.719
86	Chị Trinh Ngô	0988379376	Quốc lộ 80 ấp Bình Lợi, xã Lấp Vò, tỉnh Đồng Tháp	moi		11.00	347000.00	\N	3	3	88	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:30:08.919	2026-08-19 06:08:36.532
74	Cô Dưỡng	0373569334	11/6 trần huy liệu xã biển hồ pleiku gia lai	moi		5.00	147000.00	\N	4	2	77	\N	\N	order	da_tra	t	t	2026-08-03	2026-08-03	\N	\N	2026-08-19 04:11:19.439	2026-08-19 04:11:28.306
75	An Bình	0382089548	Ấp cầu đúc xã nhị Long càng long trà vinh	moi		5.00	147000.00	\N	3	2	78	\N	\N	order	da_tra	t	t	2026-08-03	2026-08-03	\N	\N	2026-08-19 04:12:23.325	2026-08-19 04:13:36.057
81	Phước Trần	0933972590	39 đường số 4 kp Tây A ,phường Đông Hòa ,Dĩ An ,B D .(cũ)	moi		11.00	350000.00	\N	5	3	83	\N	\N	order	da_tra	t	t	2026-08-07	2026-08-07	\N	\N	2026-08-19 04:24:31.981	2026-08-19 06:49:15.001
129	AISA		MISA	cu		5.00	149000.00	1	3	2	135	\N	\N	order	da_tra	t	t	2026-08-28	2026-08-28	\N	\N	2026-08-28 07:28:22.019	2026-09-03 01:51:52.849
123	Phạm Lê Hằng	0974718229	số 13 Trương Hán Siêu, phường Phúc Thành, thành phố Ninh Bình (nay là phường Hoa Lư) tỉnh Ninh Bình	moi		10.00	262000.00	\N	3	2	129	\N	\N	order	da_tra	t	t	2026-08-23	2026-08-23	\N	\N	2026-08-23 14:53:29.896	2026-09-03 14:40:10.107
80	Dương Ngọc Yến	0396110116	981/21, đường CMT8, Phường Tân Sơn Nhất, Tp.HCM	moi		2.00	70000.00	\N	2	3	82	\N	\N	order	da_tra	t	t	2026-08-06	2026-08-06	\N	\N	2026-08-19 04:23:09.639	2026-08-19 04:23:19.833
77	Hồ Hà	0985265083	Khối tân phú phường hoà hiếu thị xã thái hoà nghệ an	moi	Thu trước 1 kiện 10Kg	10.00	271000.00	\N	5	2	80	\N	\N	order	da_tra	t	t	2026-08-06	2026-08-06	\N	\N	2026-08-19 04:15:58.651	2026-08-19 04:16:07.178
89	Hồ Hà	0985265083	Khối tân phú phường hoà hiếu thị xã thái hoà nghệ an	cu	Kiện 2	10.00	271000.00	\N	5	2	91	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:34:25.651	2026-08-19 04:34:37.179
95	Tuấn Đinh Quang	0905013499	48/5 Nguyễn Hữu Thọ, P. Hòa cường, Đà nẵng	cu		5.00	161000.00	\N	2	3	99	\N	\N	order	da_tra	t	t	2026-08-17	2026-08-17	\N	\N	2026-08-19 04:49:11.484	2026-08-19 08:14:00.279
70	Tuấn		Thủ Đức	moi		6.00	160000.00	\N	4	2	73	\N	\N	order	da_tra	t	t	2026-07-31	2026-07-31	\N	\N	2026-08-19 03:45:24.797	2026-08-19 07:13:25.098
131	Cô Két		Ấp Hòa Thuận, Xã Hòa Bình Thạnh, Châu Thành, An Giang	moi	Có Nguyên Cám gửi 1 lần	5.00	136000.00	7	2	2	138	\N	\N	order	chua_tra	f	f	2026-09-03	2026-09-03	\N	\N	2026-09-03 14:43:47.19	2026-09-03 14:44:02.927
83	Trần Thảo	0865243766	Căn hộ B7,10, Chung cư Hausneo, số 2 đường 11, Kp10, Phường Long Trường, TPHCM	moi		2.00	70000.00	\N	2	3	85	\N	\N	order	da_tra	t	t	2026-08-09	2026-08-09	\N	\N	2026-08-19 04:26:26.678	2026-08-19 04:26:56.631
84	Kim Ngân		MISA	moi		10.00	300000.00	\N	2	2	86	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:27:36.444	2026-08-19 04:27:43.186
130	CHỊ PÉ SỬU		MISA	cu		5.00	149000.00	1	3	2	137	\N	\N	order	da_tra	t	t	2026-09-03	2026-09-03	\N	\N	2026-09-03 07:34:33.877	2026-09-03 14:48:21.331
87	Nguyễn Thị Ngọc Soạn	0906536038	41 Nguyễn Khánh Toàn, Vĩnh Hải, TP Nha Trang, Khánh Hòa.	moi		5.00	172000.00	\N	5	3	89	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:31:50.537	2026-08-19 04:32:37.27
100	Chị Uyên		ĐỒNG THÁP	moi		10.00	320000.00	\N	4	2	104	\N	\N	order	chua_tra	t	t	2026-09-03	2026-09-03	\N	\N	2026-08-19 05:12:30.006	2026-09-03 14:49:22.875
88	Hương Nguyễn Thu	0982517288	Ngõ số 3, số nhà 4, cạnh Miếu Việt Tân, thôn Phố Nỷ, xã Trung Giãn, Hà Nội.	moi		10.00	271000.00	\N	3	2	90	\N	\N	order	da_tra	t	t	2026-08-10	2026-08-10	\N	\N	2026-08-19 04:33:39.591	2026-08-19 04:33:47.896
90	Khoa Nguyen (FB)	0813552436	282 tổ 6 Hưng Thành cũ thành phố Tuyên Quang đường Tôn Đức Thắng	moi		10.00	271000.00	\N	5	2	92	\N	\N	order	da_tra	t	t	2026-08-14	2026-08-14	\N	\N	2026-08-19 04:36:31.535	2026-08-19 04:36:40.672
134	HẢI EM		AN GIANG	moi		5.00	150000.00	\N	2	2	141	\N	\N	order	da_tra	t	t	2026-09-03	2026-09-03	\N	\N	2026-09-03 15:03:37.347	2026-09-03 15:05:45.738
91	Dau Tay (FB) Anh Cường	0377730935	số nhà 124 đường Xuân canh xã đông anh Hà Nội	moi		3.00	102000.00	\N	3	3	93	\N	\N	order	da_tra	t	t	2026-08-14	2026-08-14	\N	\N	2026-08-19 04:37:56.343	2026-08-19 04:38:04.704
93	Nguyễn Hải Yến	0901781299	Siêu thị điện máy MEDIAMAT Số 18 đường Phạm Hùng Mĩ Đình Nam Từ Liêm HN	moi		10.00	271000.00	\N	3	2	95	\N	\N	order	da_tra	t	t	2026-08-17	2026-08-17	\N	\N	2026-08-19 04:41:20.956	2026-08-19 04:41:29.902
135	Tiền ăn 4 đứa		VIGEN	moi		4.00	128000.00	\N	1	2	142	\N	\N	order	da_tra	t	t	2026-09-03	2026-09-03	\N	\N	2026-09-03 15:32:19.406	2026-09-03 15:32:30.25
94	Tuấn Đinh Quang	0905013499	48/5 Nguyễn Hữu Thọ, P. Hòa cường, Đà nẵng	moi		5.00	146000.00	\N	2	2	98	\N	\N	order	da_tra	t	t	2026-08-17	2026-08-17	\N	\N	2026-08-19 04:48:48.479	2026-08-19 04:48:56.144
136	Mợ 6		Long An	moi		10.00	290000.00	2	3	2	145	\N	\N	order	da_tra	t	t	2026-09-04	2026-09-04	\N	\N	2026-09-04 01:01:25.715	2026-09-16 07:55:57.225
97	Hồng Ánh		MISA	moi		3.00	90000.00	\N	3	2	101	\N	\N	order	da_tra	t	t	2026-08-18	2026-08-18	\N	\N	2026-08-19 04:52:42.904	2026-08-19 04:52:50.606
98	Chị Ngọc		Long An	moi		20.00	598000.00	\N	3	2	102	\N	\N	order	da_tra	t	t	2026-08-18	2026-08-18	\N	\N	2026-08-19 04:58:36.661	2026-08-19 04:58:47.236
99	Thanh Nhi		MISA	moi		5.00	150000.00	\N	3	2	103	\N	\N	cskh	chua_tra	f	f	2026-08-19	2026-08-19	\N	\N	2026-08-19 05:11:22.581	2026-08-19 05:11:32.241
132	Cô Két		Ấp Hòa Thuận, Xã Hòa Bình Thạnh, Châu Thành, An Giang	moi		5.00	162000.00	9	2	3	139	\N	\N	order	chua_tra	f	f	2026-09-03	2026-09-03	\N	\N	2026-09-03 14:44:28.733	2026-09-03 15:45:05.703
124	Lê Thị Minh Trí	0789921958	125/7 Vạn Kiếp, Phường 3, Bình Thạnh	moi		10.00	290000.00	\N	3	2	130	\N	\N	order	da_tra	t	t	2026-08-23	2026-08-23	\N	\N	2026-08-23 14:55:00.117	2026-08-23 14:55:08.71
133	Nguyễn Thị Kiều Trân	0907441019	Nhà trọ Minh Trí, Ấp Mỹ Lộc, Phường An Bình, TP. Cần Thơ	moi		5.00	136000.00	7	4	2	140	\N	\N	order	da_tra	t	t	2026-09-03	2026-09-03	\N	\N	2026-09-03 14:46:30.003	2026-09-07 01:19:51.796
137	Mợ 2		Long An	moi		10.00	290000.00	2	3	2	146	\N	\N	order	da_tra	t	t	2026-09-04	2026-09-04	\N	\N	2026-09-04 01:02:58.507	2026-09-16 07:55:58.252
138	Cậu Kiệt		Long An	moi		10.00	290000.00	2	3	2	147	\N	\N	order	da_tra	t	t	2026-09-04	2026-09-04	\N	\N	2026-09-04 01:08:30.985	2026-09-16 07:55:58.968
147	Chị Tiên	0782739688	83 Đường 48 Hiệp Bình, TPHCM	moi		10.00	290000.00	2	3	2	156	\N	\N	order	da_tra	t	t	2026-09-20	2026-09-20	\N	\N	2026-09-20 13:17:18.738	2026-09-25 01:26:49.578
120	ĐẶNG VĂN TOÀN	0984649586	Xóm Trung Bắc, Xã Nghi Hoa, Huyện Nghi Lộc, Nghê An	moi		10.00	277000.00	\N	5	2	126	\N	\N	order	da_tra	t	t	2026-08-20	\N	\N	\N	2026-08-20 08:34:34.053	2026-08-24 12:36:43.808
121	Anh Hiếu Vũ	0389846097	Số nhà 18, Huỳnh Thúc Kháng, Nguyễn Lương Bằng, Thanh Bình, Hải Dương	moi	Trả hàng	0.00	0.00	\N	3	2	127	\N	\N	order	chua_tra	f	f	2026-08-20	\N	\N	\N	2026-08-20 08:55:27.429	2026-09-07 01:21:51.369
122	Trân		MISA	cu		5.00	149000.00	\N	3	2	128	\N	\N	order	da_tra	t	t	2026-08-23	\N	\N	\N	2026-08-23 14:50:44.938	2026-08-26 02:18:25.217
42	Gia Lợi		Thủ Đức	moi		6.00	160000.00	\N	5	2	46	\N	\N	order	da_tra	t	t	2026-07-15	2026-07-15	\N	\N	2026-08-19 02:56:16.617	2026-08-19 06:13:44.219
101	Chị Vân Su Shi	0941744344	Benhill Thuận Giao 25, Thuận Giao Bình Dương	moi	THỨ 5 GIAO - Tặng 2Kg	12.00	320000.00	\N	3	2	105	\N	\N	order	da_tra	t	t	2026-08-19	2026-08-19	\N	\N	2026-08-19 05:13:48.09	2026-08-20 15:09:22.979
118	Chị Hạnh		Gò Vấp	moi		5.00	160000.00	\N	4	2	123	\N	\N	order	da_tra	t	t	2026-08-07	2026-08-07	\N	\N	2026-08-19 06:50:19.661	2026-08-19 06:50:31.329
139	Chị Chi	0988727844	256 đường Trần Hưng Đạo, phường Quỳnh Lâm,tp Hoà Bình,tỉnh Hoà Bình cũ	moi	Giao chung với nguyên cám	1.00	30000.00	\N	3	2	148	\N	\N	order	chua_tra	f	f	2026-09-07	2026-09-07	\N	\N	2026-09-07 06:41:58.406	2026-09-07 06:41:59.165
140	Chị Chi	0988727844	256 đường Trần Hưng Đạo, phường Quỳnh Lâm,tp Hoà Bình,tỉnh Hoà Bình cũ	moi	Giao chung	1.00	35000.00	\N	3	3	149	\N	\N	order	chua_tra	f	f	2026-09-07	2026-09-07	\N	\N	2026-09-07 06:47:24.663	2026-09-07 06:47:25.428
127	Thu Hằng	0339568787	Tiệm sửa xe Trải, xã Lương Hòa, Tỉnh Vĩnh Long	moi	Thúy Duy	5.00	136000.00	\N	3	2	133	\N	\N	order	da_tra	t	t	2026-08-26	2026-08-26	\N	\N	2026-08-26 07:00:35.719	2026-09-03 01:52:07.508
117	Gấu		Thủ Đức	moi		5.00	150000.00	\N	4	2	121	\N	\N	order	da_tra	t	t	2026-08-19	2026-08-19	\N	\N	2026-08-19 05:59:41.782	2026-09-03 14:36:58.862
119	Nguyễn Thị Minh Nguyệt	0963783087	Thôn Khoái Trung thuộc xã Đức Bác, huyện Sông Lô, tỉnh Vĩnh Phúc (nay thuộc khu vực ven sông Lô, giáp ranh với thành phố Việt Trì, tỉnh Phú Thọ)	moi		10.00	277000.00	\N	3	2	124	\N	\N	order	da_tra	t	t	2026-08-19	2026-08-19	\N	\N	2026-08-19 14:48:34.702	2026-09-03 14:38:27.957
151	Ái Trân	0907441019	Nhà Trọ Minh Trí, Ấp Mỹ Lộc, Phường An Bình, Thành phố Cần Thơ	moi		5.00	136000.00	7	4	2	160	\N	\N	order	da_tra	t	t	2026-09-27	2026-09-27	\N	\N	2026-09-27 04:54:55.062	2026-10-22 15:14:03.712
141	Bùi Thị Tuyến Hạnh	0969043554	Cầu Trà Quang, Ấp Hòa Thuận, Xã Hòa Bình Thạnh, Huyện Châu Thành, An Giang	moi		5.00	136000.00	7	2	2	150	\N	\N	order	da_tra	t	t	2026-09-09	2026-09-09	\N	\N	2026-09-09 14:35:45.224	2026-09-20 13:15:06.563
143	Chị Lan Hue	0937865658	263/51c xóm chiếu q4	moi		10.00	290000.00	2	3	2	152	\N	\N	order	da_tra	t	t	2026-09-14	2026-09-14	\N	\N	2026-09-14 05:18:07.697	2026-09-20 13:11:53.904
150	Tiền ăn 4 đứa		VIGEN	cu		3.00	90000.00	\N	1	2	159	\N	\N	order	da_tra	t	t	2026-09-25	2026-09-25	\N	\N	2026-09-25 02:32:50.937	2026-09-25 02:33:25.619
145	Anh Khánh	0934919888	58 Villa 1, Khu Huyndai, Phường Hà Cầu, Hà Đông, Hà Nội	moi	HÚT CHÂN KHÔNG	20.00	580000.00	\N	3	2	154	\N	\N	order	chua_tra	t	t	2026-09-15	2026-09-15	\N	\N	2026-09-15 02:28:39.084	2026-09-29 01:55:33.77
149	Thịnh		MISA	cu		5.00	149000.00	1	3	2	158	\N	\N	order	chua_tra	t	f	2026-09-24	2026-09-24	\N	\N	2026-09-24 01:12:47.991	2026-09-28 01:36:39.816
144	Anh Huy Nguyen	0973200761	61 Hoàng Văn Thụ Phường 15 Quận Phú Nhuận	moi		10.00	290000.00	2	3	2	153	\N	\N	order	da_tra	t	t	2026-09-14	2026-09-14	\N	\N	2026-09-14 05:22:15.388	2026-09-29 01:55:44.693
148	Xuất gạo cho CƠM TRƯA VIGEN			moi		25.00	729000.00	\N	1	2	157	\N	\N	order	chua_tra	t	t	2026-09-20	2026-09-20	\N	\N	2026-09-20 13:19:41.529	2026-10-02 10:28:50.396
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expenses (id, kind, name, amount, date, note, "autoStock", "createdAt", "updatedAt", "stockEntryId") FROM stdin;
2	chi_phi	Nhập hàng: Gạo ST25 Thường	1800000.00	2026-08-01	Tự động từ phiếu kho #6 - NCC: SÓC TRĂNG	t	2026-08-18 07:00:32.245	2026-08-18 07:00:32.245	6
3	chi_phi	Nhập hàng: Gạo ST25 Thường	1800000.00	2026-08-06	Tự động từ phiếu kho #7 - NCC: SÓC TRĂNG	t	2026-08-18 07:01:12.694	2026-08-18 07:01:12.694	7
4	chi_phi	Nhập hàng: Gạo ST25 Nguyên Cám	1100000.00	2026-08-01	Tự động từ phiếu kho #8 - NCC: SÓC TRĂNG	t	2026-08-18 07:02:58.554	2026-08-18 07:05:02.4	8
8	von	AP- Tiền mua máy hút chân không	219000.00	2026-04-27		f	2026-08-18 07:07:45.099	2026-08-18 07:07:45.099	\N
12	von	NT - Tiền mua cân đồng hồ CP phân bổ T8	48428.00	2026-08-01		f	2026-08-18 07:21:15.729	2026-08-18 07:21:15.729	\N
46	chi_phi	Chi phí vận chuyển	100000.00	2026-08-01		f	2026-08-19 03:52:05.436	2026-08-19 03:52:05.436	\N
13	von	NT - Tiền mua cân đồng hồ CP phân bổ T9	48428.00	2026-09-01		f	2026-08-18 07:21:59.978	2026-08-18 07:22:13.291	\N
9	von	AP- Chi tiền nhập Tiền gạo	875000.00	2026-04-27		f	2026-08-18 07:11:21.56	2026-08-18 07:22:49.112	\N
14	von	NT - Tiền mua cân đồng hồ CP phân bổ T10	48428.00	2026-10-01		f	2026-08-18 07:23:06.812	2026-08-18 07:23:15.994	\N
15	von	NT - Tiền mua cân đồng hồ CP phân bổ T11	48428.00	2026-11-01		f	2026-08-18 07:23:34.182	2026-08-18 07:23:34.182	\N
16	von	NT - Tiền mua cân đồng hồ CP phân bổ T12	48428.00	2026-12-01		f	2026-08-18 07:23:53.757	2026-08-18 07:23:53.757	\N
17	von	NT - Tiền mua cân đồng hồ CP phân bổ T1/27	48428.00	2027-01-01		f	2026-08-18 07:24:14.431	2026-08-18 07:25:03.088	\N
18	von	NT - Tiền mua cân đồng hồ CP phân bổ T2/27	48428.00	2027-02-01		f	2026-08-18 07:25:34.065	2026-08-18 07:25:34.065	\N
20	von	NT - Tiền mua cân đồng hồ CP phân bổ T3/27	48428.00	2027-03-01		f	2026-08-18 07:27:05.678	2026-08-18 07:27:05.678	\N
21	von	NT - Tiền mua cân đồng hồ CP phân bổ T4/27	48428.00	2027-04-01		f	2026-08-18 07:27:30.075	2026-08-18 07:27:30.075	\N
22	von	NT - Tiền mua cân đồng hồ CP phân bổ T5/27	48428.00	2027-05-01		f	2026-08-18 07:27:51.581	2026-08-18 07:27:51.581	\N
24	von	AP - Tiền mua bao bì	90000.00	2026-04-27		f	2026-08-18 07:28:50.924	2026-08-18 07:28:50.924	\N
11	von	NT - Tiền mua cân đồng hồ CP phân bổ T7	48428.00	2026-07-01	Đã hoàn	f	2026-08-18 07:20:04.566	2026-08-24 07:08:18.554	\N
47	von	NT - Chi tiền quảng cáo	100000.00	2026-08-02		f	2026-08-19 03:52:21.438	2026-08-19 03:52:21.438	\N
28	von	HE - Bao hút chân không loại 20	75000.00	2026-07-05	Đã tất toán	f	2026-08-18 07:38:12.235	2026-08-26 15:24:17.466	\N
25	von	NT - In tem nhỏ	168800.00	2026-07-05	Đã hoàn	f	2026-08-18 07:31:22.198	2026-08-24 07:08:25.669	\N
32	von	AT - Nhãn dán gạo túi 5kg 18x28	350000.00	2026-07-08		f	2026-08-18 07:40:22.108	2026-08-18 07:40:22.108	\N
33	chi_phi	Nhập hàng: Gạo ST25 Thường	1800000.00	2026-07-16	Tự động từ phiếu kho #11 - NCC: SÓC TRĂNG	t	2026-08-18 07:41:02.399	2026-08-18 07:41:02.399	11
34	chi_phi	Nhập hàng: Gạo ST25 Thường	1800000.00	2026-07-24	Tự động từ phiếu kho #12 - NCC: SÓC TRĂNG	t	2026-08-18 07:41:23.515	2026-08-18 07:41:23.515	12
38	chi_phi	Nhập hàng: Gạo ST25 Nguyên Cám	1100000.00	2026-07-28	Tự động từ phiếu kho #13 - NCC: SÓC TRĂNG	t	2026-08-18 07:43:25.706	2026-08-18 07:43:25.706	13
43	hoan_von	NT - Tất toán toàn bộ CP cho NT	217228.00	2026-07-15	In tem nhỏ + Tiền mua cân đồng hồ CP phân bổ T7	f	2026-08-19 02:57:28.516	2026-08-19 02:57:28.516	\N
44	hoan_von	AT - Tất toán tiền "Nhãn dán gạo túi 5kg 18x28"	350000.00	2026-08-19	Nhãn dán gạo túi 5kg 18x28	f	2026-08-19 02:58:15.223	2026-08-19 02:58:15.223	\N
45	von	NT - Chi tiền quảng cáo	200000.00	2026-08-01		f	2026-08-19 03:50:54.965	2026-08-19 03:50:54.965	\N
48	chi_phi	Chi tiền In nhãn Gạo Nguyên Cám	351100.00	2026-08-02		f	2026-08-19 03:52:46.518	2026-08-19 03:52:46.518	\N
49	von	NT - Chi tiền quảng cáo	200000.00	2026-08-03		f	2026-08-19 03:53:05.05	2026-08-19 03:53:05.05	\N
50	chi_phi	Chi mua máy in tem	608000.00	2026-08-03		f	2026-08-19 03:53:31.531	2026-08-19 03:53:31.531	\N
52	chi_phi	Chi tiền In nhãn Gạo Nguyên Cám	350000.00	2026-08-04		f	2026-08-19 03:55:50.829	2026-08-19 03:55:50.829	\N
54	von	NT - Chi tiền quảng cáo	500000.00	2026-08-06		f	2026-08-19 03:56:15.34	2026-08-19 03:56:15.34	\N
55	chi_phi	CP VẬN CHUYỂN	100000.00	2026-08-06		f	2026-08-19 03:56:50.335	2026-08-19 03:56:50.335	\N
56	von	NT - Chi tiền quảng cáo	200000.00	2026-08-08		f	2026-08-19 03:57:02.465	2026-08-19 03:57:02.465	\N
57	von	NT - Chi tiền quảng cáo	400000.00	2026-08-10		f	2026-08-19 03:57:15.772	2026-08-19 03:57:15.772	\N
58	von	NT - Chi tiền quảng cáo	220000.00	2026-08-12		f	2026-08-19 03:57:29.898	2026-08-19 03:57:29.898	\N
59	von	NT - Chi tiền quảng cáo	502000.00	2026-08-14		f	2026-08-19 03:57:45.413	2026-08-19 03:57:45.413	\N
60	von	NT - Chi tiền quảng cáo	442000.00	2026-08-17		f	2026-08-19 03:58:42.835	2026-08-19 03:58:42.835	\N
62	chi_phi	Hoàn tiền cô Soạn	175000.00	2026-08-13		f	2026-08-19 04:35:09.698	2026-08-19 04:35:09.698	\N
63	hoan_von	Hoàn tiền QC T7 cho NT	935000.00	2026-08-17		f	2026-08-19 04:39:44.282	2026-08-19 04:39:44.282	\N
64	chi_phi	Phí Ship hoàn trả hàng	28000.00	2026-08-17		f	2026-08-19 04:50:05.76	2026-08-19 04:50:05.76	\N
30	von	AP - Nhãn dán gạo túi 5kg 18x28	351100.00	2026-07-07		f	2026-08-18 07:39:12.381	2026-08-19 08:52:28.279	\N
10	von	AP - Tiền mua Cân điện tử	163000.00	2026-04-27		f	2026-08-18 07:13:42.645	2026-08-19 08:52:35.019	\N
61	chi_phi	Mua máy hút chân không 40	3600000.00	2026-08-17		f	2026-08-19 04:08:42.723	2026-08-19 09:03:14.66	\N
19	von	NT - Tiền mua cân đồng hồ CP phân bổ T3/27	48428.00	2027-03-01		f	2026-08-18 07:26:19.013	2026-08-19 09:05:03.04	\N
67	von	NT - Chi tiền Quảng Cáo FB	310000.00	2026-08-20		f	2026-08-20 02:41:38.138	2026-08-20 02:41:38.138	\N
35	von	NT - Quảng cào bài viết	100000.00	2026-07-22	Đã hoàn	f	2026-08-18 07:41:59.5	2026-08-24 07:08:47.507	\N
36	von	NT - Quảng cào bài viết	100000.00	2026-07-24	Đã hoàn	f	2026-08-18 07:42:14.012	2026-08-24 07:08:52.056	\N
37	von	NT - Quảng cào bài viết	100000.00	2026-07-27	Đã hoàn	f	2026-08-18 07:42:30.57	2026-08-24 07:08:55.488	\N
39	von	NT - Quảng cào bài viết	300000.00	2026-07-28	Đã hoàn	f	2026-08-18 07:43:42.602	2026-08-24 07:08:59.733	\N
41	von	NT - Quảng cào bài viết	135000.00	2026-07-31	Đã hoàn	f	2026-08-18 07:44:08.539	2026-08-24 07:09:14.758	\N
7	von	HE - Tiền In Tem nhãn	348000.00	2026-04-27	Đã tất toán	f	2026-08-18 07:06:54.877	2026-08-26 15:23:54.288	\N
26	von	HE - Bao đựng	48000.00	2026-05-07	Đã tất toán	f	2026-08-18 07:34:41.46	2026-08-26 15:23:59.257	\N
27	von	HE - Rổ sàn	98000.00	2026-05-07	Đã tất toán	f	2026-08-18 07:35:52.656	2026-08-26 15:24:04.48	\N
42	von	HE - Chống sốc	95000.00	2026-07-30	Đã tất toán	f	2026-08-18 07:44:21.712	2026-08-26 15:24:28.503	\N
68	von	HE - Tiền mua bao bì đựng hút chân không túi 5Kg	75000.00	2026-08-15	Đã tất toán	f	2026-08-20 09:03:25.18	2026-08-26 15:24:33.755	\N
69	von	HE - Tiền mua túi đựng	50000.00	2026-08-15	Đã tất toán	f	2026-08-20 09:04:39.131	2026-08-26 15:24:40.422	\N
66	von	HE - Mua bao bì túi đựng gạo 5Kg	75000.00	2026-08-18	Đã tất toán	f	2026-08-19 08:43:21.846	2026-08-26 15:24:47.372	\N
51	von	NT - Chi tiền quảng cáo	500000.00	2026-08-04	Đã tất toán	f	2026-08-19 03:55:29.96	2026-08-26 15:25:27.454	\N
53	von	NT - Chi tiền quảng cáo	500000.00	2026-08-05	Đã tất toán	f	2026-08-19 03:56:03.74	2026-08-26 15:26:27.671	\N
31	von	AT - Nhập Gạo	1750000.00	2026-07-08	Đã hoàn	f	2026-08-18 07:39:48.234	2026-09-30 06:42:40.13	\N
40	von	NT - Quảng cào bài viết	200000.00	2026-07-30	Đã hoàn	f	2026-08-18 07:43:55.975	2026-08-24 07:09:06.682	\N
29	von	HE - Bao đựng gạo loại 30x40	48000.00	2026-07-05	Đã tất toán	f	2026-08-18 07:38:47.697	2026-08-26 15:24:22.357	\N
73	hoan_von	Tất toán chi phí 1tr cho NT	1000000.00	2026-08-26	2 CP Quảng Cáo	f	2026-08-26 15:26:16.82	2026-08-26 15:26:54.169	\N
71	hoan_von	Tất toán toàn bộ chi phí cho HE	912000.00	2026-08-26	Tất toán toàn bộ chi phí	f	2026-08-26 15:23:13.192	2026-08-26 15:27:08.376	\N
79	von	NT - Quảng cào cho DH MEDIA	100000.00	2026-08-27		f	2026-08-27 09:52:46.584	2026-08-27 09:52:46.584	\N
81	chi_phi	Chi tiền mua mộc in Date	275000.00	2026-08-27		f	2026-08-27 09:53:17.727	2026-08-27 09:53:17.727	\N
70	von	NT - Quảng cáo bài viết	452000.00	2026-08-26		f	2026-08-26 02:17:39.224	2026-08-28 07:22:00.692	\N
82	chi_phi	Nhập hàng: Gạo ST25 Thường	2288000.00	2026-08-27	Tự động từ phiếu kho #136 - NCC: SÓC TRĂNG	t	2026-08-28 07:28:59.505	2026-08-28 07:43:37.945	136
83	hoan_von	Xử lý chênh lệch so với sổ	547900.00	2026-09-03		f	2026-09-03 15:00:15.786	2026-09-03 15:00:15.786	\N
84	von	NT - Chi Ngân sách quảng cáo chạy Cho DH MEDIA	770000.00	2026-09-07		f	2026-09-07 01:15:51.675	2026-09-07 01:15:51.675	\N
85	chi_phi	Nhập hàng: Gạo ST25 Thường	693000.00	2026-09-27	Tự động từ phiếu kho #161 - NCC: BÁCH HÓA XANH - HƯƠNG SỮA	t	2026-09-28 01:39:22.092	2026-09-28 01:39:22.092	161
86	hoan_von	Hoàn tiền Chi phí nhập Gạo cho AT	1750000.00	2026-09-30	Hoàn tiền chi phí nhập gạo ngày 08/07/2026 cho AT	f	2026-09-30 06:41:56.822	2026-09-30 06:41:56.822	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, unit, "minStock", "sellPrice", note, "createdAt", "updatedAt") FROM stdin;
2	Gạo ST25 Thường	kg	20	32000.00		2026-08-18 06:41:07.67	2026-08-18 06:41:47.54
3	Gạo ST25 Nguyên Cám	kg	20	37000.00		2026-08-18 06:41:30.28	2026-08-18 06:41:53.382
\.


--
-- Data for Name: social_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.social_accounts (id, resource, username, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: stock_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_entries (id, type, "productId", qty, "unitPrice", supplier, date, note, "createdAt", "updatedAt") FROM stdin;
6	nhap	2	100.00	1800000.00	SÓC TRĂNG	2026-08-01		2026-08-18 07:00:31.022	2026-08-18 07:00:31.022
7	nhap	2	100.00	1800000.00	SÓC TRĂNG	2026-08-06		2026-08-18 07:01:11.468	2026-08-18 07:01:11.468
46	xuat	2	6.00	0.00	\N	2026-07-15	Xuất bán cho khách hàng: Gia Lợi	2026-08-19 02:56:16.967	2026-08-19 06:13:43.87
8	nhap	3	50.00	1100000.00	SÓC TRĂNG	2026-08-01		2026-08-18 07:02:57.331	2026-08-18 07:05:01.184
11	nhap	2	100.00	1800000.00	SÓC TRĂNG	2026-07-16		2026-08-18 07:41:00.965	2026-08-18 07:41:00.965
12	nhap	2	100.00	1800000.00	SÓC TRĂNG	2026-07-24		2026-08-18 07:41:22.293	2026-08-18 07:41:22.293
13	nhap	3	50.00	1100000.00	SÓC TRĂNG	2026-07-28		2026-08-18 07:43:24.283	2026-08-18 07:43:24.283
16	xuat	2	2.00	0.00	\N	2026-07-03	Xuất bán cho khách hàng: QUỲNH	2026-08-18 07:48:41.293	2026-08-18 07:48:41.293
17	xuat	2	5.00	0.00	\N	2026-07-03	Xuất bán cho khách hàng: TRANG	2026-08-18 07:49:55.376	2026-08-18 07:49:55.376
20	xuat	2	5.00	0.00	\N	2026-07-03	Xuất bán cho khách hàng: QUỲNH	2026-08-18 07:52:55.686	2026-08-18 07:53:14.016
21	xuat	2	5.00	0.00	\N	2026-07-03	Xuất bán cho khách hàng: TRÚC	2026-08-18 07:54:01.766	2026-08-18 07:54:01.766
22	xuat	2	5.00	0.00	\N	2026-07-03	Xuất bán cho khách hàng: CHỊ PÉ SỬU	2026-08-18 07:54:37.868	2026-08-18 07:54:37.868
24	xuat	2	2.00	0.00	\N	2026-07-05	Xuất bán cho khách hàng: TRÂN	2026-08-18 07:56:47.692	2026-08-18 07:56:47.692
25	xuat	2	2.00	0.00	\N	2026-07-07	Xuất bán cho khách hàng: MAI HUẾ	2026-08-18 07:57:43.301	2026-08-18 07:57:43.301
27	xuat	2	15.00	0.00	\N	2026-07-09	Xuất bán cho khách hàng: CHỊ VÂN ANH	2026-08-18 07:58:40.666	2026-08-18 07:58:40.666
28	xuat	2	2.00	0.00	\N	2026-07-09	Xuất bán cho khách hàng: QUỲNH NHI	2026-08-18 07:59:19.111	2026-08-18 07:59:19.111
29	xuat	2	5.00	0.00	\N	2026-07-09	Xuất bán cho khách hàng: CHỊ CẦM	2026-08-18 07:59:50.933	2026-08-18 07:59:50.933
30	xuat	2	5.00	0.00	\N	2026-07-09	Xuất bán cho khách hàng: CHỊ NGA	2026-08-18 08:00:22.167	2026-08-18 08:00:22.167
31	xuat	2	5.00	0.00	\N	2026-07-10	Xuất bán cho khách hàng: THÚY DUY	2026-08-18 08:00:49.222	2026-08-18 08:00:49.222
32	xuat	2	5.00	0.00	\N	2026-07-10	Xuất bán cho khách hàng: CHỊ HÂN	2026-08-18 08:01:16.855	2026-08-18 08:01:16.855
33	xuat	2	5.00	0.00	\N	2026-07-10	Xuất bán cho khách hàng: NGỌC ANH	2026-08-18 08:01:51.698	2026-08-18 08:01:51.698
34	xuat	2	5.00	0.00	\N	2026-07-10	Xuất bán cho khách hàng: CHỊ QUYÊN	2026-08-18 08:02:23.13	2026-08-18 08:02:23.13
35	xuat	2	10.00	0.00	\N	2026-07-11	Xuất bán cho khách hàng: HÂN	2026-08-18 08:02:51.221	2026-08-18 08:02:51.221
37	xuat	2	5.00	0.00	\N	2026-07-11	Xuất bán cho khách hàng: TRƯƠNG LY	2026-08-18 08:03:57.169	2026-08-18 08:03:57.169
38	xuat	2	10.00	0.00	\N	2026-08-18	Xuất bán cho khách hàng: Chị Hạnh	2026-08-18 08:06:56.935	2026-08-18 08:06:56.935
41	xuat	2	5.00	0.00	\N	2026-07-12	Xuất bán cho khách hàng: Cô Lan	2026-08-19 02:49:24.988	2026-08-19 02:49:24.988
42	xuat	2	5.00	0.00	\N	2026-07-12	Xuất bán cho khách hàng: Anh Bảo	2026-08-19 02:50:47.511	2026-08-19 02:50:47.511
43	xuat	2	2.00	0.00	\N	2026-07-14	Xuất bán cho khách hàng: Trâm	2026-08-19 02:51:40.217	2026-08-19 02:51:40.217
44	xuat	2	5.00	0.00	\N	2026-07-14	Xuất bán cho khách hàng: Vương	2026-08-19 02:54:49.146	2026-08-19 02:54:49.146
48	xuat	2	2.00	0.00	\N	2026-07-17	Xuất bán cho khách hàng: Chị Tào	2026-08-19 03:00:36.515	2026-08-19 03:00:36.515
47	xuat	2	5.00	0.00	\N	2026-07-16	Xuất bán cho khách hàng: Chị Tiên	2026-08-19 02:59:52.458	2026-08-19 03:00:51.834
50	xuat	2	1.00	0.00	\N	2026-07-20	Xuất bán cho khách hàng: Hiền	2026-08-19 03:02:06.462	2026-08-19 03:02:06.462
51	xuat	2	5.00	0.00	\N	2026-07-20	Xuất bán cho khách hàng: Như	2026-08-19 03:02:46.338	2026-08-19 03:02:46.338
52	xuat	2	5.00	0.00	\N	2026-07-20	Xuất bán cho khách hàng: Thịnh	2026-08-19 03:03:14.882	2026-08-19 03:03:14.882
53	xuat	2	1.00	0.00	\N	2026-07-22	Xuất bán cho khách hàng: Thương	2026-08-19 03:03:49.355	2026-08-19 03:03:49.355
54	xuat	2	1.00	0.00	\N	2026-07-23	Xuất bán cho khách hàng: Phát	2026-08-19 03:04:18.326	2026-08-19 03:04:18.326
55	xuat	2	5.00	0.00	\N	2026-07-25	Xuất bán cho khách hàng: Hiền	2026-08-19 03:05:03.049	2026-08-19 03:05:03.049
57	xuat	2	10.00	0.00	\N	2026-07-25	Xuất bán cho khách hàng: Chị Tiên	2026-08-19 03:06:29.068	2026-08-19 03:06:29.068
58	xuat	2	5.00	0.00	\N	2026-07-25	Xuất bán cho khách hàng: Tony Lâm	2026-08-19 03:07:18.468	2026-08-19 03:07:18.468
60	xuat	2	1.00	0.00	\N	2026-07-27	Xuất bán cho khách hàng: Anh Lập	2026-08-19 03:08:47.016	2026-08-19 03:08:47.016
61	xuat	2	5.00	0.00	\N	2026-07-27	Xuất bán cho khách hàng: AISA	2026-08-19 03:09:36.29	2026-08-19 03:09:36.29
59	xuat	2	5.00	0.00	\N	2026-07-27	Xuất bán cho khách hàng: Anh Lập	2026-08-19 03:07:59.618	2026-08-19 03:10:03.201
62	xuat	2	5.00	0.00	\N	2026-07-30	Xuất bán cho khách hàng: Cô Tuyết	2026-08-19 03:12:06.47	2026-08-19 03:12:06.47
63	xuat	2	5.00	0.00	\N	2026-07-30	Xuất bán cho khách hàng: Mai Thy	2026-08-19 03:12:40.534	2026-08-19 03:12:40.534
64	xuat	3	5.00	0.00	\N	2026-07-30	Xuất bán cho khách hàng: Cô Duyên	2026-08-19 03:33:45.435	2026-08-19 03:33:45.435
65	xuat	2	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: A Giang	2026-08-19 03:36:26.752	2026-08-19 03:36:26.752
66	xuat	3	20.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Cô Hằng	2026-08-19 03:37:24.428	2026-08-19 03:37:24.428
56	xuat	2	5.00	0.00	\N	2026-07-25	Xuất bán cho khách hàng: Cô Hằng	2026-08-19 03:05:38.274	2026-08-19 03:38:03.31
67	xuat	3	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Tony Lâm	2026-08-19 03:38:34.041	2026-08-19 03:38:34.041
68	xuat	2	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Chú Sinh	2026-08-19 03:40:58.621	2026-08-19 03:40:58.621
69	xuat	2	10.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Diệu Thạnh	2026-08-19 03:42:10.066	2026-08-19 03:42:10.066
70	xuat	2	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Dung Nguyen	2026-08-19 03:43:21.59	2026-08-19 03:43:21.59
71	xuat	2	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Mai Le	2026-08-19 03:44:04.047	2026-08-19 03:44:04.047
72	xuat	2	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Gấu	2026-08-19 03:44:34.261	2026-08-19 03:44:34.261
74	xuat	3	5.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Phát	2026-08-19 03:46:19.603	2026-08-19 03:46:19.603
75	xuat	2	2.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Như Hảo	2026-08-19 03:47:08.307	2026-08-19 03:47:08.307
23	xuat	2	6.00	0.00	\N	2026-07-05	Xuất bán cho khách hàng: HOÀI THƯ	2026-08-18 07:56:11.108	2026-08-19 06:14:48.236
45	xuat	2	1.00	0.00	\N	2026-07-15	Xuất bán cho khách hàng: Ái Thi	2026-08-19 02:55:29.646	2026-08-19 06:20:03.144
14	xuat	2	6.00	0.00	\N	2026-07-01	Xuất bán cho khách hàng: NGỌC SANG	2026-08-18 07:46:23.722	2026-08-19 07:07:06.324
15	xuat	2	6.00	0.00	\N	2026-07-01	Xuất bán cho khách hàng: GẤU	2026-08-18 07:47:41.404	2026-08-19 07:08:19.996
26	xuat	2	6.00	0.00	\N	2026-07-08	Xuất bán cho khách hàng: CHỊ TRÂN	2026-08-18 07:58:12.593	2026-08-19 07:09:02.87
36	xuat	2	6.00	0.00	\N	2026-07-11	Xuất bán cho khách hàng: HOÀI NHUẬN	2026-08-18 08:03:19.725	2026-08-19 07:10:02.222
49	xuat	2	6.00	0.00	\N	2026-07-20	Xuất bán cho khách hàng: Chị Vy	2026-08-19 03:01:29.85	2026-08-19 07:10:48.3
73	xuat	2	6.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Tuấn	2026-08-19 03:45:25.147	2026-08-19 07:13:24.719
76	xuat	2	30.00	0.00	\N	2026-07-31	Xuất bán cho khách hàng: Lê Văn Nhật	2026-08-19 03:49:39.64	2026-08-19 03:49:39.64
77	xuat	2	5.00	0.00	\N	2026-08-03	Xuất bán cho khách hàng: Cô Dưỡng	2026-08-19 04:11:19.794	2026-08-19 04:11:19.794
78	xuat	2	5.00	0.00	\N	2026-08-03	Xuất bán cho khách hàng: An Bình	2026-08-19 04:12:23.674	2026-08-19 04:12:23.674
80	xuat	2	10.00	0.00	\N	2026-08-06	Xuất bán cho khách hàng: Hồ Hà	2026-08-19 04:15:59.002	2026-08-19 04:15:59.002
81	xuat	2	3.00	0.00	\N	2026-08-06	Xuất bán cho khách hàng: Trân	2026-08-19 04:16:34.102	2026-08-19 04:16:34.102
82	xuat	3	2.00	0.00	\N	2026-08-06	Xuất bán cho khách hàng: Dương Ngọc Yến	2026-08-19 04:23:09.99	2026-08-19 04:23:09.99
85	xuat	3	2.00	0.00	\N	2026-08-09	Xuất bán cho khách hàng: Trần Thảo	2026-08-19 04:26:27.026	2026-08-19 04:26:27.026
86	xuat	2	10.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Kim Ngân	2026-08-19 04:27:36.619	2026-08-19 04:27:36.619
87	xuat	3	5.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Anh Nhựt	2026-08-19 04:28:58.667	2026-08-19 04:28:58.667
89	xuat	3	5.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Nguyễn Thị Ngọc Soạn	2026-08-19 04:31:50.889	2026-08-19 04:31:50.889
90	xuat	2	10.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Hương Nguyễn Thu	2026-08-19 04:33:39.947	2026-08-19 04:33:39.947
91	xuat	2	10.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Hồ Hà	2026-08-19 04:34:26.002	2026-08-19 04:34:26.002
92	xuat	2	10.00	0.00	\N	2026-08-14	Xuất bán cho khách hàng: Khoa Nguyen (FB)	2026-08-19 04:36:31.885	2026-08-19 04:36:31.885
93	xuat	3	3.00	0.00	\N	2026-08-14	Xuất bán cho khách hàng: Dau Tay (FB) Anh Cường	2026-08-19 04:37:56.694	2026-08-19 04:37:56.694
94	xuat	3	5.00	0.00	\N	2026-08-15	Xuất bán cho khách hàng: Chú Hướng	2026-08-19 04:38:59.608	2026-08-19 04:38:59.608
95	xuat	2	10.00	0.00	\N	2026-08-17	Xuất bán cho khách hàng: Nguyễn Hải Yến	2026-08-19 04:41:21.308	2026-08-19 04:41:21.308
96	nhap	2	50.00	0.00		2026-04-17		2026-08-19 04:44:58.056	2026-08-19 04:44:58.056
97	nhap	2	100.00	0.00		2026-07-08		2026-08-19 04:46:06.687	2026-08-19 04:46:06.687
98	xuat	2	5.00	0.00	\N	2026-08-17	Xuất bán cho khách hàng: Tuấn Đinh Quang	2026-08-19 04:48:48.831	2026-08-19 04:48:48.831
125	nhap	2	21.00	0.00		2026-08-19	Nhập bù hàng	2026-08-19 14:49:33.049	2026-08-19 14:49:33.049
101	xuat	2	3.00	0.00	\N	2026-08-18	Xuất bán cho khách hàng: Hồng Ánh	2026-08-19 04:52:43.256	2026-08-19 04:52:43.256
102	xuat	2	20.00	0.00	\N	2026-08-18	Xuất bán cho khách hàng: Chị Ngọc	2026-08-19 04:58:37.012	2026-08-19 04:58:37.012
103	xuat	2	5.00	0.00	\N	2026-08-19	Xuất bán cho khách hàng: Thanh Nhi	2026-08-19 05:11:22.98	2026-08-19 05:11:22.98
127	xuat	2	0.00	0.00	\N	2026-08-20	Xuất bán cho khách hàng: Anh Hiếu Vũ	2026-08-20 08:55:27.795	2026-09-07 01:21:51.018
140	xuat	2	5.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: Nguyễn Thị Kiều Trân	2026-09-03 14:46:30.359	2026-09-03 14:46:30.359
104	xuat	2	10.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: Chị Uyên	2026-08-19 05:12:30.356	2026-09-03 14:49:22.525
84	xuat	2	45.00	0.00	\N	2026-08-07	Xuất bán cho khách hàng: NGỌC ANH	2026-08-19 04:25:18.386	2026-08-19 06:07:33.691
88	xuat	3	11.00	0.00	\N	2026-08-10	Xuất bán cho khách hàng: Chị Trinh Ngô	2026-08-19 04:30:09.27	2026-08-19 06:08:36.184
83	xuat	3	11.00	0.00	\N	2026-08-07	Xuất bán cho khách hàng: Phước Trần	2026-08-19 04:24:32.33	2026-08-19 06:49:14.646
123	xuat	2	5.00	0.00	\N	2026-08-07	Xuất bán cho khách hàng: Chị Hạnh	2026-08-19 06:50:20.024	2026-08-19 06:50:20.024
122	xuat	2	11.00	0.00	\N	2026-08-06	Xuất bán cho khách hàng: Nguyễn Hồng Mai	2026-08-19 06:06:06.993	2026-08-19 08:01:41.431
99	xuat	3	5.00	0.00	\N	2026-08-17	Xuất bán cho khách hàng: Tuấn Đinh Quang	2026-08-19 04:49:11.836	2026-08-19 08:13:59.92
124	xuat	2	10.00	0.00	\N	2026-08-19	Xuất bán cho khách hàng: Nguyễn Thị Minh Nguyệt	2026-08-19 14:48:35.061	2026-08-20 15:08:17.477
105	xuat	2	12.00	0.00	\N	2026-08-19	Xuất bán cho khách hàng: Chị Vân Su Shi	2026-08-19 05:13:48.439	2026-08-20 15:09:01.238
149	xuat	3	1.00	0.00	\N	2026-09-07	Xuất bán cho khách hàng: Chị Chi	2026-09-07 06:47:25.07	2026-09-07 06:47:25.07
128	xuat	2	5.00	0.00	\N	2026-08-23	Xuất bán cho khách hàng: Trân	2026-08-23 14:50:45.292	2026-08-23 14:50:45.292
141	xuat	2	5.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: HẢI EM	2026-09-03 15:03:37.743	2026-09-03 15:05:12.917
129	xuat	2	10.00	0.00	\N	2026-08-23	Xuất bán cho khách hàng: Phạm Lê Hằng	2026-08-23 14:53:30.25	2026-08-23 14:54:02.664
130	xuat	2	10.00	0.00	\N	2026-08-23	Xuất bán cho khách hàng: Lê Thị Minh Trí	2026-08-23 14:55:00.469	2026-08-23 14:55:00.469
126	xuat	2	10.00	0.00	\N	2026-08-20	Xuất bán cho khách hàng: ĐẶNG VĂN TOÀN	2026-08-20 08:34:34.413	2026-08-24 07:14:03.236
121	xuat	2	5.00	0.00	\N	2026-08-19	Xuất bán cho khách hàng: Gấu	2026-08-19 05:59:42.137	2026-08-24 07:14:47.133
131	xuat	2	5.00	0.00	\N	2026-08-24	Xuất bán cho khách hàng: Chị Tuyền	2026-08-24 08:48:06.37	2026-08-24 08:48:06.37
133	xuat	2	5.00	0.00	\N	2026-08-26	Xuất bán cho khách hàng: Thu Hằng	2026-08-26 07:00:36.112	2026-08-26 07:00:36.112
134	xuat	3	8.00	0.00	\N	2026-08-27	Xuất bán cho khách hàng: Chị Hoa	2026-08-27 12:46:36.724	2026-08-27 12:46:36.724
135	xuat	2	5.00	0.00	\N	2026-08-28	Xuất bán cho khách hàng: AISA	2026-08-28 07:28:22.422	2026-08-28 07:28:22.422
136	nhap	2	104.00	2288000.00	SÓC TRĂNG	2026-08-27		2026-08-28 07:28:58.104	2026-08-28 07:43:36.664
137	xuat	2	5.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: CHỊ PÉ SỬU	2026-09-03 07:34:34.245	2026-09-03 07:34:34.245
138	xuat	2	5.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: Cô Két	2026-09-03 14:43:47.586	2026-09-03 14:43:47.586
139	xuat	3	5.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: Cô Két	2026-09-03 14:44:29.086	2026-09-03 14:44:29.086
142	xuat	2	4.00	0.00	\N	2026-09-03	Xuất bán cho khách hàng: Tiền ăn 4 đứa	2026-09-03 15:32:19.765	2026-09-03 15:32:19.765
143	xuat	2	11.00	0.00		2026-09-03	Xử lý chênh lệch âm kho	2026-09-03 15:34:05.095	2026-09-03 15:34:05.095
144	nhap	3	7.00	0.00		2026-09-03	Xử lý chênh lệch âm kho	2026-09-03 15:35:11.477	2026-09-03 15:35:11.477
145	xuat	2	10.00	0.00	\N	2026-09-04	Xuất bán cho khách hàng: Mợ 6	2026-09-04 01:01:26.074	2026-09-04 01:01:26.074
146	xuat	2	10.00	0.00	\N	2026-09-04	Xuất bán cho khách hàng: Mợ 2	2026-09-04 01:02:58.864	2026-09-04 01:02:58.864
147	xuat	2	10.00	0.00	\N	2026-09-04	Xuất bán cho khách hàng: Cậu Kiệt	2026-09-04 01:08:31.393	2026-09-04 01:08:31.393
148	xuat	2	1.00	0.00	\N	2026-09-07	Xuất bán cho khách hàng: Chị Chi	2026-09-07 06:41:58.807	2026-09-07 06:41:58.807
150	xuat	2	5.00	0.00	\N	2026-09-09	Xuất bán cho khách hàng: Bùi Thị Tuyến Hạnh	2026-09-09 14:35:45.706	2026-09-09 14:36:15.449
152	xuat	2	10.00	0.00	\N	2026-09-14	Xuất bán cho khách hàng: Chị Lan Hue	2026-09-14 05:18:08.056	2026-09-14 05:18:08.056
153	xuat	2	10.00	0.00	\N	2026-09-14	Xuất bán cho khách hàng: Anh Huy Nguyen	2026-09-14 05:22:15.741	2026-09-14 05:22:15.741
156	xuat	2	10.00	0.00	\N	2026-09-20	Xuất bán cho khách hàng: Chị Tiên	2026-09-20 13:17:19.1	2026-09-20 13:17:19.1
154	xuat	2	20.00	0.00	\N	2026-09-15	Xuất bán cho khách hàng: Anh Khánh	2026-09-15 02:28:39.447	2026-09-20 13:13:39.642
158	xuat	2	5.00	0.00	\N	2026-09-24	Xuất bán cho khách hàng: Thịnh	2026-09-24 01:12:48.399	2026-09-24 01:12:48.399
159	xuat	2	3.00	0.00	\N	2026-09-25	Xuất bán cho khách hàng: Tiền ăn 4 đứa	2026-09-25 02:32:51.294	2026-09-25 02:32:51.294
160	xuat	2	5.00	0.00	\N	2026-09-27	Xuất bán cho khách hàng: Ái Trân	2026-09-27 04:54:55.422	2026-09-27 04:54:55.422
161	nhap	2	35.00	693000.00	BÁCH HÓA XANH	2026-09-27	HƯƠNG SỮA	2026-09-28 01:39:20.832	2026-09-28 01:39:20.832
157	xuat	2	25.00	0.00	\N	2026-09-20	Xuất bán cho khách hàng: Xuất gạo cho CƠM TRƯA VIGEN	2026-09-20 13:19:41.879	2026-09-28 01:43:25.708
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, "passwordHash", role, "createdAt", "updatedAt") FROM stdin;
1	admin	$2b$10$uhkaNIrT37wkzOm5S.RWpO72QekniUaQ4S/A8stat0.qo/zyfhxIe	admin	2026-08-12 11:21:36.668	2026-08-12 11:21:36.668
2	hai_em	$2b$10$5K4QSX0OaVolwqsOBWbkqeIQSpCvsR5/B9oXSsFM/VgrMsCUqZTpe	staff	2026-08-12 11:21:37.141	2026-08-12 11:21:37.141
3	ngoc_thuong	$2b$10$OX3wDczRu/7ZKjwnrw33DOQymmI35YByXjs6AfG0d66ryJBFCXXau	staff	2026-08-12 11:21:37.45	2026-08-12 11:21:37.45
4	ai_thi	$2b$10$s0N5i9gVJRwn6nHyWtJpQ.muYWA774rv6pak2/0FghlFYdw6ptAO6	staff	2026-08-12 11:21:37.752	2026-08-12 11:21:37.752
5	tan_phat	$2b$10$F0PPOi59qo15o4zhMiBMZ.9lEfcjfYVQz4VSSjrf2yUsrcfsPnBom	staff	2026-08-12 11:21:38.061	2026-08-12 11:21:38.061
\.


--
-- Name: combos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.combos_id_seq', 12, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 152, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expenses_id_seq', 86, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 3, true);


--
-- Name: social_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.social_accounts_id_seq', 1, false);


--
-- Name: stock_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_entries_id_seq', 161, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: combos combos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: stock_entries stock_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_entries
    ADD CONSTRAINT stock_entries_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: customers_giftStockEntryId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "customers_giftStockEntryId_key" ON public.customers USING btree ("giftStockEntryId");


--
-- Name: customers_staffUserId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "customers_staffUserId_idx" ON public.customers USING btree ("staffUserId");


--
-- Name: customers_stage_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX customers_stage_idx ON public.customers USING btree (stage);


--
-- Name: customers_stockEntryId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "customers_stockEntryId_key" ON public.customers USING btree ("stockEntryId");


--
-- Name: expenses_stockEntryId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "expenses_stockEntryId_key" ON public.expenses USING btree ("stockEntryId");


--
-- Name: stock_entries_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "stock_entries_productId_idx" ON public.stock_entries USING btree ("productId");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: combos combos_giftProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT "combos_giftProductId_fkey" FOREIGN KEY ("giftProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: combos combos_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT "combos_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_comboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES public.combos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_giftProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_giftProductId_fkey" FOREIGN KEY ("giftProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_giftStockEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_giftStockEntryId_fkey" FOREIGN KEY ("giftStockEntryId") REFERENCES public.stock_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_staffUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_stockEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_stockEntryId_fkey" FOREIGN KEY ("stockEntryId") REFERENCES public.stock_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenses expenses_stockEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_stockEntryId_fkey" FOREIGN KEY ("stockEntryId") REFERENCES public.stock_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_entries stock_entries_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_entries
    ADD CONSTRAINT "stock_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 7pJD2lp0vtcijqzbgiQ0KodZVlhngb0JS6PkEemCOmyU0H7q6EVPcaekqkU8zwr

