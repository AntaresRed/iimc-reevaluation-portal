-- ============================================================================
--  Seed data — run after 01_schema.sql.
--  Generated from the professor directory and section mapping in js/app.js.
--  Safe to re-run: existing rows are updated, nothing is deleted.
-- ============================================================================

-- The MBA office. Add or remove rows here to change who can open windows and
-- deactivate students. Anyone listed here sees the admin dashboard instead of
-- the student one, so don't list a student's own account.
insert into public.app_admins (email, note) values
  ('mbaoffice@email.iimcal.ac.in', 'MBA Office'),
  ('examcell@email.iimcal.ac.in', 'Exam Cell')
on conflict (email) do nothing;

-- Faculty: signing in with one of these addresses gives the professor view.
insert into public.faculty (email, name) values
  ('anirvan.pant@email.iimcal.ac.in', 'Prof. Anirvan Pant'),
  ('arnab.bhattacharya@email.iimcal.ac.in', 'Prof. Arnab Bhattacharya'),
  ('avijit.bansal@email.iimcal.ac.in', 'Prof. Avijit Bansal'),
  ('ayesha.arora@email.iimcal.ac.in', 'Prof. Ayesha Arora'),
  ('balram.avittathur@email.iimcal.ac.in', 'Prof. Balram Avittathur'),
  ('biswatosh.saha@email.iimcal.ac.in', 'Prof. Biswatosh Saha'),
  ('kaushik.roy@email.iimcal.ac.in', 'Prof. Kaushik Roy'),
  ('latasri.hazarika@email.iimcal.ac.in', 'Prof. Latasri Hazarika'),
  ('partha.datta@email.iimcal.ac.in', 'Prof. Partha Priya Datta'),
  ('peeyush.mehta@email.iimcal.ac.in', 'Prof. Peeyush Mehta'),
  ('ramya.venkateswaran@email.iimcal.ac.in', 'Prof. Ramya T Venkateswaran'),
  ('saptarshi.purkayastha@email.iimcal.ac.in', 'Prof. Saptarshi Purkayastha'),
  ('sudarshan.kumar@email.iimcal.ac.in', 'Prof. Sudarshan Kumar'),
  ('sudhakar.reddy@email.iimcal.ac.in', 'Prof. Sudhakar Reddy S'),
  ('manish.thakur@email.iimcal.ac.in', 'Prof. Manish Kr. Thakur'),
  ('saikat.maitra@email.iimcal.ac.in', 'Prof. Saikat Maitra'),
  ('somdeep.chatterjee@email.iimcal.ac.in', 'Prof. Somdeep Chatterjee'),
  ('samarth.gupta@email.iimcal.ac.in', 'Prof. Samarth Gupta'),
  ('s.sikdar@email.iimcal.ac.in', 'Prof. S Sikdar'),
  ('anupama.mehta@email.iimcal.ac.in', 'Prof. Peeyush Mehta (Anupama)'),
  ('dharmaraju.bathini@email.iimcal.ac.in', 'Prof. Dharma Raju Bathini'),
  ('madhuparna.karmokar@email.iimcal.ac.in', 'Prof. Madhuparna Karmokar')
on conflict (email) do update set name = excluded.name;

-- Which professor marks which section of which subject.
insert into public.course_sections (subject, section, professor_name) values
  ('Strategic Management', 'A', 'Prof. Anirvan Pant'),
  ('Corporate Finance', 'E', 'Prof. Arnab Bhattacharya'),
  ('Corporate Finance', 'F', 'Prof. Arnab Bhattacharya'),
  ('Corporate Finance', 'D', 'Prof. Avijit Bansal'),
  ('Operations Management', 'E', 'Prof. Ayesha Arora'),
  ('Operations Management', 'A', 'Prof. Balram Avittathur'),
  ('Operations Management', 'D', 'Prof. Balram Avittathur'),
  ('Strategic Management', 'B', 'Prof. Biswatosh Saha'),
  ('Strategic Management', 'F', 'Prof. Kaushik Roy'),
  ('Strategic Management', 'D', 'Prof. Latasri Hazarika'),
  ('Operations Management', 'B', 'Prof. Partha Priya Datta'),
  ('Operations Management', 'C', 'Prof. Partha Priya Datta'),
  ('Operations Management', 'F', 'Prof. Peeyush Mehta'),
  ('Strategic Management', 'E', 'Prof. Ramya T Venkateswaran'),
  ('Strategic Management', 'C', 'Prof. Saptarshi Purkayastha'),
  ('Corporate Finance', 'A', 'Prof. Sudarshan Kumar'),
  ('Corporate Finance', 'B', 'Prof. Sudhakar Reddy S'),
  ('Corporate Finance', 'C', 'Prof. Sudhakar Reddy S'),
  ('Morphologies of the Social', 'A', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'B', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'C', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'D', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'E', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'F', 'Prof. Manish Kr. Thakur'),
  ('Morphologies of the Social', 'A', 'Prof. Saikat Maitra'),
  ('Morphologies of the Social', 'B', 'Prof. Saikat Maitra'),
  ('Morphologies of the Social', 'C', 'Prof. Saikat Maitra'),
  ('Morphologies of the Social', 'D', 'Prof. Saikat Maitra'),
  ('Morphologies of the Social', 'E', 'Prof. Saikat Maitra'),
  ('Morphologies of the Social', 'F', 'Prof. Saikat Maitra'),
  ('India and the World Economy', 'A', 'Prof. Somdeep Chatterjee'),
  ('India and the World Economy', 'B', 'Prof. Somdeep Chatterjee'),
  ('India and the World Economy', 'C', 'Prof. Samarth Gupta'),
  ('India and the World Economy', 'D', 'Prof. Samarth Gupta'),
  ('India and the World Economy', 'E', 'Prof. S Sikdar'),
  ('India and the World Economy', 'F', 'Prof. S Sikdar'),
  ('Management Game', 'A', 'Prof. Kaushik Roy'),
  ('Management Game', 'B', 'Prof. Peeyush Mehta (Anupama)'),
  ('Management Game', 'C', 'Prof. Dharma Raju Bathini'),
  ('Management Game', 'D', 'Prof. Madhuparna Karmokar'),
  ('Management Game', 'E', 'Prof. Saptarshi Purkayastha'),
  ('Management Game', 'F', 'Prof. Sudarshan Kumar')
on conflict (subject, section, professor_name) do nothing;
