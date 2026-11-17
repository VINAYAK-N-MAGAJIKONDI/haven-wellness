-- Migration: 0002_seed_data.sql
-- Seed initial verified mental wellness partners and crisis resources

INSERT OR IGNORE INTO consultants (
    id, name, designation, credentials_verified, areas_of_practice, languages, short_bio, booking_url, availability_info, is_active, created_at, updated_at
) VALUES 
(
    'c-telemanas-org',
    'Tele-MANAS National Tele-Mental Health Programme',
    'Government Verified Mental Health Helpline',
    1,
    '["Crisis Intervention", "Anxiety", "Depression", "General Counseling"]',
    '["English", "Hindi", "Regional Indian Languages"]',
    'Tele-MANAS provides 24/7, free, confidential mental health services across India under the Ministry of Health and Family Welfare.',
    'tel:14416',
    '24/7 Free Immediate Helpline',
    1,
    1700000000,
    1700000000
),
(
    'c-nimhans-clinic',
    'NIMHANS Outpatient & Tele-Care',
    'Apex National Healthcare Institute',
    1,
    '["Clinical Psychology", "Psychiatric Evaluation", "Stress Management"]',
    '["English", "Hindi", "Kannada"]',
    'National Institute of Mental Health and Neuro Sciences (NIMHANS), premier institute for mental healthcare and neurosciences.',
    'https://nimhans.ac.in',
    'Mon-Sat 9:00 AM - 4:30 PM',
    1,
    1700000000,
    1700000000
),
(
    'c-dr-priya-sharma',
    'Dr. Priya Sharma, M.Phil, PhD',
    'Consultant Clinical Psychologist (RCI Registered)',
    1,
    '["Cognitive Behavioral Support", "Anxiety & Burnout", "Life Transitions"]',
    '["English", "Hindi"]',
    'RCI Registered Clinical Psychologist specializing in adult mental wellness, stress management, and evidence-informed counseling.',
    'https://example-health-booking.org/dr-priya-sharma',
    'Tue, Thu, Sat (Online Consultations)',
    1,
    1700000000,
    1700000000
);
