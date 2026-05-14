-- Employee Salary Calculator System — public schema only (no data)
-- Reference: PostgreSQLDB.sql structure; safe for GitHub / live demos.

SET client_encoding = 'UTF8';

-- Sequences
CREATE SEQUENCE public.allowances_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.bonuses_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.deductions_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.employees_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.reports_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.salary_slips_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.users_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Tables
CREATE TABLE public.employees (
    id integer NOT NULL,
    full_name character varying(255),
    email character varying(255),
    phone character varying(50),
    department character varying(100) NOT NULL,
    "position" character varying(100) NOT NULL,
    hire_date date NOT NULL,
    basic_salary numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_basic_salary_check CHECK ((basic_salary >= (0)::numeric)),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'Terminated'::character varying])::text[])))
);

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    employee_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Admin'::character varying, 'HR'::character varying, 'Accountant'::character varying, 'Employee'::character varying, 'Management'::character varying])::text[])))
);

CREATE TABLE public.allowances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    type character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    effective_from date DEFAULT CURRENT_DATE,
    effective_to date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT allowances_amount_check CHECK ((amount >= (0)::numeric))
);

CREATE TABLE public.deductions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    type character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    effective_from date DEFAULT CURRENT_DATE,
    effective_to date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deductions_amount_check CHECK ((amount >= (0)::numeric))
);

CREATE TABLE public.bonuses (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    type character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    awarded_date date NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bonuses_amount_check CHECK ((amount >= (0)::numeric))
);

CREATE TABLE public.salary_slips (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    basic_salary numeric(10,2) NOT NULL,
    total_allowances numeric(10,2) DEFAULT 0 NOT NULL,
    total_bonus numeric(10,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(10,2) DEFAULT 0 NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by integer,
    CONSTRAINT salary_slips_month_check CHECK (((month >= 1) AND (month <= 12)))
);

CREATE TABLE public.reports (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    period character varying(100) NOT NULL,
    total_employees integer DEFAULT 0,
    total_salaries numeric(15,2) DEFAULT 0,
    average_salary numeric(10,2) DEFAULT 0,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by integer,
    file_path character varying(500),
    CONSTRAINT reports_type_check CHECK (((type)::text = ANY ((ARRAY['monthly'::character varying, 'annual'::character varying, 'custom'::character varying])::text[])))
);

-- Sequence ownership & column defaults
ALTER SEQUENCE public.allowances_id_seq OWNED BY public.allowances.id;
ALTER SEQUENCE public.bonuses_id_seq OWNED BY public.bonuses.id;
ALTER SEQUENCE public.deductions_id_seq OWNED BY public.deductions.id;
ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;
ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;
ALTER SEQUENCE public.salary_slips_id_seq OWNED BY public.salary_slips.id;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.allowances ALTER COLUMN id SET DEFAULT nextval('public.allowances_id_seq'::regclass);
ALTER TABLE ONLY public.bonuses ALTER COLUMN id SET DEFAULT nextval('public.bonuses_id_seq'::regclass);
ALTER TABLE ONLY public.deductions ALTER COLUMN id SET DEFAULT nextval('public.deductions_id_seq'::regclass);
ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);
ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);
ALTER TABLE ONLY public.salary_slips ALTER COLUMN id SET DEFAULT nextval('public.salary_slips_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Primary keys & uniques & checks (table-level)
ALTER TABLE ONLY public.allowances ADD CONSTRAINT allowances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bonuses ADD CONSTRAINT bonuses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.deductions ADD CONSTRAINT deductions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_email_key UNIQUE (email);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_full_name_key UNIQUE (full_name);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_phone_key UNIQUE (phone);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reports ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.salary_slips ADD CONSTRAINT salary_slips_employee_id_month_year_key UNIQUE (employee_id, month, year);
ALTER TABLE ONLY public.salary_slips ADD CONSTRAINT salary_slips_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);

-- Indexes
CREATE INDEX idx_allowances_employee ON public.allowances USING btree (employee_id);
CREATE INDEX idx_bonuses_employee ON public.bonuses USING btree (employee_id);
CREATE INDEX idx_deductions_employee ON public.deductions USING btree (employee_id);
CREATE INDEX idx_employees_department ON public.employees USING btree (department);
CREATE INDEX idx_employees_status ON public.employees USING btree (status);
CREATE INDEX idx_salary_slips_employee ON public.salary_slips USING btree (employee_id);
CREATE INDEX idx_salary_slips_period ON public.salary_slips USING btree (year, month);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_users_username ON public.users USING btree (username);

-- Foreign keys
ALTER TABLE ONLY public.allowances
    ADD CONSTRAINT allowances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bonuses
    ADD CONSTRAINT bonuses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.deductions
    ADD CONSTRAINT deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id);
