-- Add 5 jobs for ABC Corporation
DO $$ 
DECLARE
    v_employer_id uuid;
BEGIN
    -- Get ABC Corporation's employer ID
    SELECT id INTO v_employer_id 
    FROM employer_profiles 
    WHERE company_name = 'ABC Corporation';

    -- Insert 5 new jobs
    INSERT INTO jobs (
        employer_id,
        title,
        company,
        location,
        description,
        requirements,
        salary_min,
        salary_max,
        employment_type,
        experience_level,
        category,
        status
    ) VALUES
    -- Job 1: Manufacturing Engineer
    (
        v_employer_id,
        'Manufacturing Engineer',
        'ABC Corporation',
        'Delhi, India',
        'We are seeking a skilled Manufacturing Engineer to optimize our production processes and improve manufacturing efficiency.\n\nKey Responsibilities:\n- Design and implement manufacturing processes\n- Analyze and improve production efficiency\n- Ensure quality control standards\n- Coordinate with production teams\n- Implement lean manufacturing principles',
        '- Bachelor''s degree in Manufacturing/Industrial Engineering\n- 3+ years of manufacturing experience\n- Knowledge of lean manufacturing principles\n- Experience with quality control systems\n- Strong problem-solving abilities\n- Excellent project management skills',
        75000,
        120000,
        'full-time',
        3,
        'Technology',
        'active'
    ),
    -- Job 2: Quality Control Supervisor
    (
        v_employer_id,
        'Quality Control Supervisor',
        'ABC Corporation',
        'Delhi, India',
        'Looking for a detail-oriented Quality Control Supervisor to maintain our high standards of product quality.\n\nKey Responsibilities:\n- Oversee quality control processes\n- Train and supervise QC team\n- Maintain documentation and reports\n- Implement quality improvement initiatives',
        '- 5+ years of quality control experience\n- Knowledge of ISO standards\n- Strong leadership abilities\n- Experience with quality management systems\n- Excellent attention to detail',
        65000,
        95000,
        'full-time',
        4,
        'Technology',
        'active'
    ),
    -- Job 3: Production Manager
    (
        v_employer_id,
        'Production Manager',
        'ABC Corporation',
        'Delhi, India',
        'Seeking an experienced Production Manager to oversee our manufacturing operations.\n\nKey Responsibilities:\n- Manage daily production operations\n- Optimize production schedules\n- Ensure safety compliance\n- Coordinate with other departments\n- Meet production targets',
        '- 7+ years of production management experience\n- Strong leadership and team management skills\n- Knowledge of production planning systems\n- Experience with ERP systems\n- Excellence in operational optimization',
        100000,
        150000,
        'full-time',
        5,
        'Technology',
        'active'
    ),
    -- Job 4: Supply Chain Analyst
    (
        v_employer_id,
        'Supply Chain Analyst',
        'ABC Corporation',
        'Delhi, India',
        'We are looking for a Supply Chain Analyst to optimize our supply chain operations.\n\nKey Responsibilities:\n- Analyze supply chain data\n- Identify improvement opportunities\n- Coordinate with suppliers\n- Optimize inventory levels\n- Generate reports and forecasts',
        '- Bachelor''s degree in Supply Chain or related field\n- 2+ years of supply chain experience\n- Strong analytical skills\n- Proficiency in Excel and data analysis\n- Knowledge of supply chain management systems',
        50000,
        80000,
        'full-time',
        2,
        'Technology',
        'active'
    ),
    -- Job 5: Maintenance Technician
    (
        v_employer_id,
        'Maintenance Technician',
        'ABC Corporation',
        'Delhi, India',
        'Seeking a skilled Maintenance Technician to keep our manufacturing equipment running smoothly.\n\nKey Responsibilities:\n- Perform preventive maintenance\n- Troubleshoot equipment issues\n- Repair machinery\n- Maintain maintenance records\n- Respond to emergency repairs',
        '- Technical diploma or certification\n- 3+ years of industrial maintenance experience\n- Knowledge of mechanical and electrical systems\n- Experience with preventive maintenance\n- Available for different shifts',
        40000,
        60000,
        'full-time',
        2,
        'Technology',
        'active'
    );
END $$; 