/* أوزاني — أقسام النادي وأجهزته
   k: نوع التسجيل   w = وزن × عدات × جلسات | bw = وزن الجسم | t = وقت | c = كارديو
   eq: نوع الوزن     bar = بار أولمبي | sm = سميث | db = دمبل | mc = جهاز | cb = كيبل | pl = جهاز بأقراص | ez = بار قصير
   lv: اسم خانة المستوى في الكارديو
   l: تسمية خاصة لخانة الوزن */
window.AWZ_DATA = {
  sections: [
    { id: 'chest',     name: 'الصدر',    color: 'red' },
    { id: 'back',      name: 'الظهر',    color: 'blue' },
    { id: 'legs',      name: 'الأرجل',   color: 'yellow' },
    { id: 'shoulders', name: 'الأكتاف',  color: 'green' },
    { id: 'arms',      name: 'الذراع',   color: 'white' },
    { id: 'abs',       name: 'البطن',    color: 'silver' },
    { id: 'cardio',    name: 'الكارديو', color: 'black' }
  ],
  machines: [
    // الصدر
    { id: 'chest-press',      s: 'chest', n: 'تشيست برس',            e: 'Chest Press',              k: 'w', eq: 'mc' },
    { id: 'incline-press-mc', s: 'chest', n: 'تشيست برس مائل',       e: 'Incline Chest Press',      k: 'w', eq: 'mc' },
    { id: 'bench-bar',        s: 'chest', n: 'بنش برس بالبار',        e: 'Barbell Bench Press',      k: 'w', eq: 'bar' },
    { id: 'incline-bar',      s: 'chest', n: 'بنش مائل بالبار',       e: 'Incline Bench Press',      k: 'w', eq: 'bar' },
    { id: 'decline-bar',      s: 'chest', n: 'بنش مقلوب بالبار',      e: 'Decline Bench Press',      k: 'w', eq: 'bar' },
    { id: 'bench-db',         s: 'chest', n: 'بنش برس بالدمبل',       e: 'Dumbbell Bench Press',     k: 'w', eq: 'db' },
    { id: 'incline-db',       s: 'chest', n: 'بنش مائل بالدمبل',      e: 'Incline Dumbbell Press',   k: 'w', eq: 'db' },
    { id: 'pec-deck',         s: 'chest', n: 'فلاي (بيك دك)',         e: 'Pec Deck Fly',             k: 'w', eq: 'mc' },
    { id: 'fly-db',           s: 'chest', n: 'فلاي بالدمبل',          e: 'Dumbbell Fly',             k: 'w', eq: 'db' },
    { id: 'cable-cross',      s: 'chest', n: 'كيبل كروس أوفر',        e: 'Cable Crossover',          k: 'w', eq: 'cb' },
    { id: 'smith-bench',      s: 'chest', n: 'بنش سميث',              e: 'Smith Machine Bench',      k: 'w', eq: 'sm' },
    { id: 'dips',             s: 'chest', n: 'ديبس (متوازي)',         e: 'Dips',                     k: 'bw' },
    { id: 'pushup',           s: 'chest', n: 'ضغط (بوش أب)',          e: 'Push-up',                  k: 'bw' },

    // الظهر
    { id: 'lat-pulldown',     s: 'back', n: 'لات بول داون',          e: 'Lat Pulldown',             k: 'w', eq: 'cb' },
    { id: 'seated-row-mc',    s: 'back', n: 'سيتد رو (جهاز)',        e: 'Seated Row Machine',       k: 'w', eq: 'mc' },
    { id: 'cable-row',        s: 'back', n: 'رو بالكيبل (جالس)',     e: 'Seated Cable Row',         k: 'w', eq: 'cb' },
    { id: 'high-row',         s: 'back', n: 'هاي رو (جهاز)',         e: 'High Row',                 k: 'w', eq: 'pl' },
    { id: 'tbar-row',         s: 'back', n: 'تي بار رو',             e: 'T-Bar Row',                k: 'w', eq: 'pl' },
    { id: 'row-bar',          s: 'back', n: 'رو بالبار (منحني)',     e: 'Bent-over Barbell Row',    k: 'w', eq: 'bar' },
    { id: 'row-db',           s: 'back', n: 'رو بالدمبل (يد وحدة)',  e: 'One-arm Dumbbell Row',     k: 'w', eq: 'db' },
    { id: 'deadlift',         s: 'back', n: 'ديدلفت',                e: 'Deadlift',                 k: 'w', eq: 'bar' },
    { id: 'straight-arm',     s: 'back', n: 'بول أوفر بالكيبل',      e: 'Straight-arm Pulldown',    k: 'w', eq: 'cb' },
    { id: 'pullup',           s: 'back', n: 'عقلة',                  e: 'Pull-up',                  k: 'bw' },
    { id: 'assist-pullup',    s: 'back', n: 'عقلة مساعدة (جهاز)',    e: 'Assisted Pull-up',         k: 'w', eq: 'mc', l: 'وزن المساعدة' },
    { id: 'back-ext',         s: 'back', n: 'باك إكستنشن',           e: 'Back Extension',           k: 'bw' },

    // الأرجل
    { id: 'leg-press',        s: 'legs', n: 'ليق برس',               e: 'Leg Press',                k: 'w', eq: 'pl' },
    { id: 'squat-bar',        s: 'legs', n: 'سكوات بالبار',          e: 'Barbell Squat',            k: 'w', eq: 'bar' },
    { id: 'hack-squat',       s: 'legs', n: 'هاك سكوات',             e: 'Hack Squat',               k: 'w', eq: 'pl' },
    { id: 'smith-squat',      s: 'legs', n: 'سكوات سميث',            e: 'Smith Squat',              k: 'w', eq: 'sm' },
    { id: 'goblet',           s: 'legs', n: 'سكوات بالدمبل (قوبلت)', e: 'Goblet Squat',             k: 'w', eq: 'db' },
    { id: 'leg-ext',          s: 'legs', n: 'ليق إكستنشن',           e: 'Leg Extension',            k: 'w', eq: 'mc' },
    { id: 'leg-curl-lying',   s: 'legs', n: 'ليق كيرل (منبطح)',      e: 'Lying Leg Curl',           k: 'w', eq: 'mc' },
    { id: 'leg-curl-seated',  s: 'legs', n: 'ليق كيرل (جالس)',       e: 'Seated Leg Curl',          k: 'w', eq: 'mc' },
    { id: 'rdl',              s: 'legs', n: 'رومانيان ديدلفت',       e: 'Romanian Deadlift',        k: 'w', eq: 'bar' },
    { id: 'lunges-db',        s: 'legs', n: 'لنجز بالدمبل',          e: 'Dumbbell Lunges',          k: 'w', eq: 'db' },
    { id: 'bulgarian',        s: 'legs', n: 'بلغاري سبلت سكوات',     e: 'Bulgarian Split Squat',    k: 'w', eq: 'db' },
    { id: 'hip-thrust',       s: 'legs', n: 'هيب ثرست',              e: 'Hip Thrust',               k: 'w', eq: 'bar' },
    { id: 'abductor',         s: 'legs', n: 'أبدكتور (فتح)',         e: 'Hip Abduction',            k: 'w', eq: 'mc' },
    { id: 'adductor',         s: 'legs', n: 'أدكتور (ضم)',           e: 'Hip Adduction',            k: 'w', eq: 'mc' },
    { id: 'calf-standing',    s: 'legs', n: 'سمانة واقف',            e: 'Standing Calf Raise',      k: 'w', eq: 'mc' },
    { id: 'calf-seated',      s: 'legs', n: 'سمانة جالس',            e: 'Seated Calf Raise',        k: 'w', eq: 'pl' },

    // الأكتاف
    { id: 'shoulder-press-mc',s: 'shoulders', n: 'شولدر برس (جهاز)',      e: 'Shoulder Press Machine',  k: 'w', eq: 'mc' },
    { id: 'shoulder-press-db',s: 'shoulders', n: 'ضغط أكتاف بالدمبل',     e: 'Dumbbell Shoulder Press', k: 'w', eq: 'db' },
    { id: 'ohp',              s: 'shoulders', n: 'ضغط عسكري بالبار',      e: 'Overhead Press',          k: 'w', eq: 'bar' },
    { id: 'arnold',           s: 'shoulders', n: 'أرنولد برس',            e: 'Arnold Press',            k: 'w', eq: 'db' },
    { id: 'lateral-db',       s: 'shoulders', n: 'رفرفة جانبي بالدمبل',   e: 'Dumbbell Lateral Raise',  k: 'w', eq: 'db' },
    { id: 'lateral-mc',       s: 'shoulders', n: 'رفرفة جانبي (جهاز)',    e: 'Lateral Raise Machine',   k: 'w', eq: 'mc' },
    { id: 'lateral-cable',    s: 'shoulders', n: 'رفرفة جانبي بالكيبل',   e: 'Cable Lateral Raise',     k: 'w', eq: 'cb' },
    { id: 'front-raise',      s: 'shoulders', n: 'رفرفة أمامي',           e: 'Front Raise',             k: 'w', eq: 'db' },
    { id: 'rear-delt',        s: 'shoulders', n: 'رفرفة خلفي (جهاز)',     e: 'Reverse Pec Deck',        k: 'w', eq: 'mc' },
    { id: 'face-pull',        s: 'shoulders', n: 'فيس بول',               e: 'Face Pull',               k: 'w', eq: 'cb' },
    { id: 'upright-row',      s: 'shoulders', n: 'أبرايت رو',             e: 'Upright Row',             k: 'w', eq: 'ez' },
    { id: 'shrugs',           s: 'shoulders', n: 'ترابيس بالدمبل',        e: 'Dumbbell Shrugs',         k: 'w', eq: 'db' },

    // الذراع
    { id: 'curl-bar',         s: 'arms', n: 'بايسبس بالبار',          e: 'Barbell Curl',             k: 'w', eq: 'ez' },
    { id: 'curl-db',          s: 'arms', n: 'بايسبس بالدمبل',         e: 'Dumbbell Curl',            k: 'w', eq: 'db' },
    { id: 'hammer',           s: 'arms', n: 'هامر كيرل',              e: 'Hammer Curl',              k: 'w', eq: 'db' },
    { id: 'curl-cable',       s: 'arms', n: 'بايسبس بالكيبل',         e: 'Cable Curl',               k: 'w', eq: 'cb' },
    { id: 'preacher-mc',      s: 'arms', n: 'بريتشر كيرل (جهاز)',     e: 'Preacher Curl Machine',    k: 'w', eq: 'mc' },
    { id: 'concentration',    s: 'arms', n: 'بايسبس تركيز',           e: 'Concentration Curl',       k: 'w', eq: 'db' },
    { id: 'pushdown',         s: 'arms', n: 'ترايسبس بوش داون',       e: 'Triceps Pushdown',         k: 'w', eq: 'cb' },
    { id: 'overhead-tri',     s: 'arms', n: 'ترايسبس خلف الراس',      e: 'Overhead Triceps Extension', k: 'w', eq: 'cb' },
    { id: 'skull',            s: 'arms', n: 'سكل كرشر',               e: 'Skull Crusher',            k: 'w', eq: 'ez' },
    { id: 'tri-dip-mc',       s: 'arms', n: 'ترايسبس ديبس (جهاز)',    e: 'Seated Dip Machine',       k: 'w', eq: 'mc' },
    { id: 'kickback',         s: 'arms', n: 'كيك باك بالدمبل',        e: 'Triceps Kickback',         k: 'w', eq: 'db' },
    { id: 'wrist-curl',       s: 'arms', n: 'ساعد (ريست كيرل)',       e: 'Wrist Curl',               k: 'w', eq: 'db' },

    // البطن
    { id: 'ab-crunch-mc',     s: 'abs', n: 'كرنش (جهاز)',            e: 'Ab Crunch Machine',        k: 'w', eq: 'mc' },
    { id: 'cable-crunch',     s: 'abs', n: 'كرنش بالكيبل',           e: 'Cable Crunch',             k: 'w', eq: 'cb' },
    { id: 'torso-rot',        s: 'abs', n: 'لف الخصر (جهاز)',        e: 'Rotary Torso',             k: 'w', eq: 'mc' },
    { id: 'crunch',           s: 'abs', n: 'كرنش أرضي',              e: 'Crunches',                 k: 'bw' },
    { id: 'leg-raise',        s: 'abs', n: 'رفع رجلين (معلّق)',      e: 'Hanging Leg Raise',        k: 'bw' },
    { id: 'russian-twist',    s: 'abs', n: 'روسيان تويست',           e: 'Russian Twist',            k: 'bw' },
    { id: 'ab-wheel',         s: 'abs', n: 'عجلة البطن',             e: 'Ab Wheel',                 k: 'bw' },
    { id: 'plank',            s: 'abs', n: 'بلانك',                  e: 'Plank',                    k: 't' },

    // الكارديو
    { id: 'treadmill',        s: 'cardio', n: 'سير (تريدميل)',        e: 'Treadmill',                k: 'c', lv: 'السرعة' },
    { id: 'bike',             s: 'cardio', n: 'دراجة ثابتة',          e: 'Stationary Bike',          k: 'c', lv: 'المستوى' },
    { id: 'elliptical',       s: 'cardio', n: 'إليبتيكال',            e: 'Elliptical',               k: 'c', lv: 'المستوى' },
    { id: 'stairs',           s: 'cardio', n: 'درج (ستير ماستر)',     e: 'Stair Climber',            k: 'c', lv: 'المستوى' },
    { id: 'rower',            s: 'cardio', n: 'تجديف',                e: 'Rowing Machine',           k: 'c', lv: 'المستوى' },
    { id: 'jump-rope',        s: 'cardio', n: 'نط الحبل',             e: 'Jump Rope',                k: 'c' }
  ]
};
