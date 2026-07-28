import type { GameMode } from '../shared/gameTypes'

export const SITE_URL = 'https://andy.knasoftware.com'
export const SITE_NAME = 'Perfect Pitch'
export const DEFAULT_TITLE = 'Perfect Pitch | Free Ear Training with Real Piano Sounds'
export const DEFAULT_DESCRIPTION =
  'Practice notes, intervals, melodies, arpeggios, chords, scales, and seventh chords online with real piano sounds and instant feedback.'
export const SOCIAL_IMAGE_PATH = '/branding/perfect-pitch-app-icon.png'

export interface SeoSection {
  heading: string
  paragraphs: string[]
  points?: string[]
}

export interface SeoFaq {
  question: string
  answer: string
}

export interface SeoPageContent {
  path: string
  language: 'en' | 'vi'
  locale: 'en_US' | 'vi_VN'
  title: string
  description: string
  eyebrow: string
  heading: string
  intro: string
  sections: SeoSection[]
  faqs: SeoFaq[]
  practiceMode?: GameMode
  practiceLabel: string
  relatedPaths: string[]
  alternatePath?: string
}

export const SEO_PAGES: SeoPageContent[] = [
  {
    path: '/ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Free Online Ear Training Exercises | Perfect Pitch',
    description:
      'Practice ear training online for free with real piano sounds, instant feedback, and focused exercises for notes, intervals, melodies, chords, and scales.',
    eyebrow: 'Free online ear training',
    heading: 'Train your musical ear with focused piano exercises',
    intro:
      'Perfect Pitch is a free browser-based ear trainer for musicians who want short, practical listening drills. Hear a piano prompt, choose one of four answers, and get the correct result immediately.',
    sections: [
      {
        heading: 'What you can practice',
        paragraphs: [
          'Start with single notes, then move into double notes, melodies, intervals, arpeggios, triads, scales, and seventh chords. Five difficulty levels keep each mode useful as your listening becomes more reliable.',
          'The exercises focus on recognition rather than long theory lessons, so you can move directly from hearing a sound to making a musical decision.',
        ],
        points: [
          'Single notes for pitch-class recognition',
          'Intervals and melodies for relative listening',
          'Chords, arpeggios, scales, and seventh chords for harmony',
        ],
      },
      {
        heading: 'A simple practice routine',
        paragraphs: [
          'Choose one mode and stay with it for a short session. Play each prompt once, commit to an answer, and use Replay only when you need to compare what you remember with what you hear.',
          'When a question is difficult, pay attention to one feature at a time: direction for melodies, distance for intervals, and brightness or tension for chord qualities.',
        ],
      },
      {
        heading: 'Why the sound feels musical',
        paragraphs: [
          'Perfect Pitch uses sample-based piano playback instead of a plain oscillator. The natural attack and decay give each exercise a musical shape that is closer to everyday piano practice.',
          'Audio loads only after you press Play, which keeps the first page load light and respects browser autoplay rules.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is this ear training app free?',
        answer:
          'Yes. You can use every available training mode in the browser without creating an account.',
      },
      {
        question: 'Where should a beginner start?',
        answer:
          'Start with single notes or easy intervals. Add chords, scales, and melodies after the first exercises feel consistent.',
      },
      {
        question: 'Do I need to install anything?',
        answer:
          'No. The trainer runs in a modern web browser and plays its built-in piano samples after your first Play gesture.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Start free ear training',
    relatedPaths: [
      '/perfect-pitch-training',
      '/interval-ear-training',
      '/chord-ear-training',
      '/ear-training-for-kids',
    ],
    alternatePath: '/vi/luyen-cam-am',
  },
  {
    path: '/perfect-pitch-training',
    language: 'en',
    locale: 'en_US',
    title: 'Perfect Pitch Training | Practice Note Recognition',
    description:
      'Practice perfect pitch and note recognition with real piano playback, five difficulty levels, and instant feedback after every answer.',
    eyebrow: 'Perfect pitch training',
    heading: 'Practice identifying piano notes by ear',
    intro:
      'Perfect pitch, also called absolute pitch, means recognizing a note without first hearing a reference. This trainer gives you a direct note-recognition exercise without promising a guaranteed outcome.',
    sections: [
      {
        heading: 'Start with pitch class',
        paragraphs: [
          'Single-note rounds ask for the pitch class rather than the octave. C4 and C5 are therefore both answered as C, keeping your attention on the note name itself.',
          'The easy level begins with a smaller answer set. Later levels introduce more chromatic notes and closer distractors.',
        ],
      },
      {
        heading: 'How to build a useful listening habit',
        paragraphs: [
          'Use short, repeatable sessions and track which notes you confuse. Before guessing, notice whether the sound feels stable, bright, dark, or tense relative to notes you already remember.',
          'Results vary between learners. Note-recognition practice can still improve pitch memory and musical attention even when it does not lead to absolute pitch.',
        ],
      },
      {
        heading: 'Combine absolute and relative listening',
        paragraphs: [
          'Single-note practice isolates note names. Interval, melody, and chord exercises train relationships between notes. Musicians can benefit from using both approaches instead of treating them as competing skills.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can adults practice perfect pitch?',
        answer:
          'Adults can practice note recognition and pitch memory. Individual results differ, so the useful goal is more consistent listening rather than a guaranteed label.',
      },
      {
        question: 'Does the app test octaves?',
        answer:
          'Single-note answers identify pitch class only. Different octaves of the same note share one answer name.',
      },
      {
        question: 'Is this the same as interval training?',
        answer:
          'No. Note recognition names one pitch without a reference, while interval training identifies the distance between two notes.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Practice note recognition',
    relatedPaths: ['/what-is-perfect-pitch', '/interval-ear-training', '/piano-ear-training'],
    alternatePath: '/vi/luyen-nghe-not-nhac',
  },
  {
    path: '/interval-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Interval Ear Training | Learn Intervals by Ear',
    description:
      'Practice interval recognition with real piano playback, melodic and harmonic exercises, five levels, and instant grading.',
    eyebrow: 'Interval ear training',
    heading: 'Learn to recognize musical intervals by ear',
    intro:
      'An interval is the distance between two notes. Recognizing that distance helps with singing, transcription, improvisation, and understanding how melodies move.',
    sections: [
      {
        heading: 'Melodic and harmonic intervals',
        paragraphs: [
          'Melodic intervals place notes one after another, making direction and distance easier to hear. Harmonic intervals stack notes together and ask you to recognize the combined color.',
          'The trainer introduces wider and more similar choices as difficulty increases, including chromatic and compound intervals at advanced levels.',
        ],
      },
      {
        heading: 'What to listen for',
        paragraphs: [
          'First notice whether the second note moves up or down. Then estimate whether the distance is small, medium, wide, or larger than an octave before choosing a specific name.',
          'If two answers feel close, replay the same question and compare the amount of tension rather than trying to identify both notes separately.',
        ],
      },
      {
        heading: 'Connect intervals to real music',
        paragraphs: [
          'Intervals are the building blocks inside melodies, chords, and scales. After a short interval session, switch to melody or chord mode to hear the same relationships in a larger musical context.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why should musicians train intervals?',
        answer:
          'Intervals help you hear movement and harmonic relationships, which supports transcription, improvisation, tuning, and playing by ear.',
      },
      {
        question: 'Should beginners memorize songs for every interval?',
        answer:
          'Song references can be a starting aid, but regular comparison across different root notes builds a more flexible interval memory.',
      },
      {
        question: 'Is interval training relative pitch?',
        answer:
          'Yes. The task identifies a relationship between notes rather than naming one note without a reference.',
      },
    ],
    practiceMode: 'interval',
    practiceLabel: 'Start interval practice',
    relatedPaths: ['/melody-ear-training', '/chord-ear-training', '/ear-training'],
    alternatePath: '/vi/luyen-quang',
  },
  {
    path: '/chord-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Chord Ear Training | Identify Piano Chords by Ear',
    description:
      'Practice chord ear training with real piano sounds, instant feedback, and progressive exercises for major, minor, diminished, and augmented triads.',
    eyebrow: 'Chord ear training',
    heading: 'Recognize triads and harmonic color by ear',
    intro:
      'Chord ear training helps you hear harmony as a combined color instead of guessing each note separately. Perfect Pitch plays triads together and grades your choice immediately.',
    sections: [
      {
        heading: 'Hear the chord as one sound',
        paragraphs: [
          'Easy exercises separate major and minor qualities. Harder levels add diminished and augmented triads, inversions, and choices that share the same root.',
          'Listen for stability, brightness, darkness, and tension before trying to name individual chord tones.',
        ],
      },
      {
        heading: 'Use arpeggios as a bridge',
        paragraphs: [
          'Arpeggio mode plays the chord tones separately. Chord mode stacks them. Moving between the two helps connect melodic memory with harmonic recognition.',
        ],
      },
      {
        heading: 'A focused chord routine',
        paragraphs: [
          'Begin with major versus minor until the distinction is consistent. Add one new quality at a time, then practice mixed roots so you recognize the quality rather than memorizing one voicing.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which chord types are included?',
        answer:
          'The triad exercises include major, minor, diminished, and augmented qualities as difficulty increases.',
      },
      {
        question: 'Should I learn intervals before chords?',
        answer:
          'Basic interval recognition can make chord training easier, but beginners can also start by comparing major and minor chord colors directly.',
      },
      {
        question: 'Are seventh chords included?',
        answer:
          'Yes. Seventh chords have their own mode so four-note qualities and inversions can be practiced separately from triads.',
      },
    ],
    practiceMode: 'chord',
    practiceLabel: 'Start chord practice',
    relatedPaths: ['/seventh-chord-ear-training', '/interval-ear-training', '/ear-training'],
    alternatePath: '/vi/luyen-hop-am',
  },
  {
    path: '/piano-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Piano Ear Training | Practice with Real Piano Samples',
    description:
      'Use free piano ear training exercises with sample-based playback for notes, intervals, melodies, arpeggios, chords, and scales.',
    eyebrow: 'Piano ear training',
    heading: 'Ear training with sample-based piano playback',
    intro:
      'Piano notes have a distinct attack, body, and decay. Perfect Pitch uses local piano samples so listening practice feels closer to a musical instrument than a plain test tone.',
    sections: [
      {
        heading: 'Why instrument timbre matters',
        paragraphs: [
          'Pitch is only one part of a sound. Practicing with piano timbre also teaches you to listen through the instrument attack and focus on the note or relationship underneath it.',
          'The sampled range supports every question generated by the eight exercise modes.',
        ],
      },
      {
        heading: 'Practice directly in your browser',
        paragraphs: [
          'No piano or installation is required. Audio remains unloaded until you press Play, and Replay uses the exact same question instead of generating a new one.',
        ],
      },
      {
        heading: 'Choose a listening target',
        paragraphs: [
          'Use note mode for pitch names, interval and melody modes for movement, or chord and scale modes for harmony. Staying with one target for a session makes errors easier to understand.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do I need a piano?',
        answer:
          'No. The exercises use built-in piano samples and run directly in the browser.',
      },
      {
        question: 'Does the app use synthesized tones?',
        answer:
          'The musical questions use local piano samples rather than a simple oscillator.',
      },
      {
        question: 'Can I replay a question?',
        answer:
          'Yes. Replay repeats the current question payload so you can compare the same sound before answering.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Start piano ear training',
    relatedPaths: ['/ear-training', '/perfect-pitch-training', '/interval-ear-training'],
  },
  {
    path: '/what-is-perfect-pitch',
    language: 'en',
    locale: 'en_US',
    title: 'What Is Perfect Pitch? Absolute vs Relative Pitch',
    description:
      'Learn what perfect pitch means, how absolute pitch differs from relative pitch, and what note-recognition practice can realistically train.',
    eyebrow: 'Absolute pitch explained',
    heading: 'What is perfect pitch?',
    intro:
      'Perfect pitch, or absolute pitch, is the ability to identify or produce a musical note without first receiving a reference note.',
    sections: [
      {
        heading: 'Perfect pitch and relative pitch are different',
        paragraphs: [
          'Absolute pitch names a note directly. Relative pitch compares notes and recognizes intervals, chord qualities, scale patterns, or melodic movement.',
          'Many musicians rely primarily on relative pitch. Perfect pitch can be useful, but it is not a requirement for strong musicianship.',
        ],
      },
      {
        heading: 'What can be practiced?',
        paragraphs: [
          'Note-recognition drills can develop pitch memory and make your answers more consistent. Interval, melody, and harmony exercises develop the relational listening used throughout real music.',
          'No responsible exercise can guarantee that every learner will acquire absolute pitch. A better goal is measurable improvement in the listening tasks that matter to you.',
        ],
      },
      {
        heading: 'How Perfect Pitch supports both skills',
        paragraphs: [
          'Single-note mode focuses on pitch names. The other seven modes place notes into intervals, melodic patterns, arpeggios, chords, scales, and seventh chords.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is perfect pitch required to be a good musician?',
        answer:
          'No. Relative pitch, rhythm, technique, memory, and musical expression are all important, and many excellent musicians do not have absolute pitch.',
      },
      {
        question: 'Can perfect pitch be guaranteed through training?',
        answer:
          'No. Training can improve note recognition and pitch memory, but individual outcomes vary and should not be guaranteed.',
      },
      {
        question: 'What should I practice first?',
        answer:
          'Start with single-note recognition and easy intervals, then add melodies and harmony as your answers become more stable.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Try note recognition',
    relatedPaths: ['/perfect-pitch-training', '/interval-ear-training', '/ear-training'],
    alternatePath: '/vi/cao-do-tuyet-doi',
  },
  {
    path: '/scale-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Scale Ear Training | Identify Scales by Ear',
    description:
      'Practice identifying major, minor, modal, whole-tone, and blues scales by ear with real piano playback and instant feedback.',
    eyebrow: 'Scale ear training',
    heading: 'Learn to identify scales by their musical color',
    intro:
      'Scale ear training connects individual notes to a complete tonal pattern. Each question asks you to identify both the root and the scale quality.',
    sections: [
      {
        heading: 'Build from major and minor',
        paragraphs: [
          'Easy levels begin with familiar major and minor colors. Higher levels add modes, whole-tone patterns, blues scales, and closer distractors across different roots.',
        ],
      },
      {
        heading: 'Listen for the characteristic notes',
        paragraphs: [
          'Instead of memorizing every note, listen for the scale degrees that create the strongest color: a lowered third, a raised fourth, a flattened seventh, or the even spacing of a whole-tone scale.',
        ],
      },
      {
        heading: 'Connect scales to melodies and chords',
        paragraphs: [
          'Follow scale practice with melody or chord mode. This helps you hear how the same tonal material behaves when it is rearranged into musical phrases and harmony.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which scales are available?',
        answer:
          'The exercise expands from major and minor into modal, whole-tone, and blues material as difficulty increases.',
      },
      {
        question: 'Do answers include the root note?',
        answer:
          'Yes. A correct answer identifies both the scale root and its quality.',
      },
      {
        question: 'Should I learn scale theory first?',
        answer:
          'Basic scale names help, but you can begin by comparing a small set of qualities and learn the sound alongside the label.',
      },
    ],
    practiceMode: 'scale',
    practiceLabel: 'Start scale practice',
    relatedPaths: ['/melody-ear-training', '/chord-ear-training', '/ear-training'],
  },
  {
    path: '/melody-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Melody Ear Training | Practice Short Melodies',
    description:
      'Practice melody ear training with short piano phrases, matching answer sequences, five difficulty levels, and instant feedback.',
    eyebrow: 'Melody ear training',
    heading: 'Train your ear with short piano melodies',
    intro:
      'Melody ear training asks you to remember a sequence, follow its direction, and distinguish it from closely related alternatives.',
    sections: [
      {
        heading: 'Hear shape before individual notes',
        paragraphs: [
          'Begin by noticing whether the phrase rises, falls, repeats, or changes direction. This melodic contour narrows the choices before you identify exact note relationships.',
        ],
      },
      {
        heading: 'Difficulty grows with your memory',
        paragraphs: [
          'Early questions use short phrases. Advanced levels add longer sequences, repeated notes, tighter timing, and distractors that differ by only one or two pitches.',
        ],
      },
      {
        heading: 'Use intervals as a support skill',
        paragraphs: [
          'Interval practice makes each movement inside a melody easier to describe. Alternate between the two modes when a phrase feels too complex to hold as one shape.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do all answer choices have the same length?',
        answer:
          'Yes. Every melody choice matches the number of notes in the played phrase.',
      },
      {
        question: 'Can a melody repeat notes?',
        answer:
          'Yes. More advanced levels include repeated notes and denser melodic patterns.',
      },
      {
        question: 'What should I listen for first?',
        answer:
          'Start with contour and repeated notes, then compare the size of each movement.',
      },
    ],
    practiceMode: 'melody',
    practiceLabel: 'Start melody practice',
    relatedPaths: ['/interval-ear-training', '/scale-ear-training', '/ear-training'],
  },
  {
    path: '/seventh-chord-ear-training',
    language: 'en',
    locale: 'en_US',
    title: 'Seventh Chord Ear Training | Identify 7th Chords',
    description:
      'Practice identifying four-note seventh chords, qualities, roots, and inversions with sampled piano playback and instant grading.',
    eyebrow: 'Seventh chord ear training',
    heading: 'Recognize seventh chords by root and quality',
    intro:
      'Seventh chords add a fourth note to a triad, creating richer tension and color. This dedicated mode keeps those four-note choices separate from basic chord practice.',
    sections: [
      {
        heading: 'Begin with the broad quality',
        paragraphs: [
          'Listen for whether the chord feels settled, bright, dark, blues-like, or strongly unresolved before identifying the exact symbol. Advanced levels add inversions and close same-root distractors.',
        ],
      },
      {
        heading: 'Use triads as your foundation',
        paragraphs: [
          'If four-note chords feel crowded, practice major, minor, diminished, and augmented triads first. Then listen for the added seventh as a new layer on top of a familiar base.',
        ],
      },
      {
        heading: 'Practice across different roots',
        paragraphs: [
          'Changing roots prevents one piano register or voicing from becoming the only cue. The answer must identify a distinct root-and-quality combination.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How many notes are in each chord?',
        answer: 'Each seventh-chord question contains four chord tones.',
      },
      {
        question: 'Are inversions included?',
        answer: 'Yes. Advanced levels introduce inversions and closer harmonic distractors.',
      },
      {
        question: 'Should I practice triads first?',
        answer:
          'Triad recognition is a helpful foundation, especially if seventh-chord qualities still sound too similar.',
      },
    ],
    practiceMode: 'seventh',
    practiceLabel: 'Start seventh-chord practice',
    relatedPaths: ['/chord-ear-training', '/interval-ear-training', '/ear-training'],
  },
  {
    path: '/ear-training-for-kids',
    language: 'en',
    locale: 'en_US',
    title: 'Ear Training Games for Kids | Free Piano Practice',
    description:
      'Try child-friendly ear training games with real piano sounds, instant answers, five levels, and pets that grow through regular practice.',
    eyebrow: 'Ear training for kids',
    heading: 'A playful ear training game for young musicians',
    intro:
      'Perfect Pitch turns short listening exercises into a pet-growing game. Children hear a piano prompt, choose an answer, and see the correct result right away.',
    sections: [
      {
        heading: 'Clear goals and immediate feedback',
        paragraphs: [
          'Every question has four choices and grades the first selection immediately. Correct answers earn music notes and help the selected pet grow without hiding mistakes or delaying the result.',
        ],
      },
      {
        heading: 'A progression that stays musical',
        paragraphs: [
          'Five levels expand the listening challenge from notes and simple intervals to melodies, chords, scales, and seventh chords. The reward layer supports practice, while the task remains focused on hearing music.',
        ],
      },
      {
        heading: 'How adults can support a session',
        paragraphs: [
          'Ask the learner to describe what changed before choosing an answer. A short session on one mode is easier to discuss than moving quickly across every exercise.',
          'The app stores progress in the current browser and does not require an account, so adults should use the same device and browser when they want progress to continue.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does a child need an account?',
        answer:
          'No. The available exercises and pet progress work in the browser without account creation.',
      },
      {
        question: 'Where is progress saved?',
        answer:
          'Progress is saved locally in the current browser. Clearing browser storage or switching devices can remove that local progress.',
      },
      {
        question: 'Which mode is best for a beginner?',
        answer:
          'Single notes and easy intervals provide the clearest starting point for most beginners.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Start a child-friendly exercise',
    relatedPaths: ['/ear-training', '/perfect-pitch-training', '/interval-ear-training'],
  },
  {
    path: '/vi/luyen-cam-am',
    language: 'vi',
    locale: 'vi_VN',
    title: 'Luyện Cảm Âm Online Miễn Phí | Perfect Pitch',
    description:
      'Luyện cảm âm online miễn phí với tiếng đàn piano thật, phản hồi tức thì và bài tập nhận biết nốt, quãng, giai điệu, hợp âm và âm giai.',
    eyebrow: 'Luyện cảm âm online',
    heading: 'Luyện cảm âm bằng những bài nghe piano ngắn',
    intro:
      'Perfect Pitch là công cụ luyện tai miễn phí trên trình duyệt. Bạn nghe một mẫu piano, chọn một trong bốn đáp án và biết kết quả chính xác ngay sau lần chọn đầu tiên.',
    sections: [
      {
        heading: 'Bạn có thể luyện những gì?',
        paragraphs: [
          'Tám chế độ bao gồm nốt đơn, hai nốt, giai điệu ngắn, quãng, rải hợp âm, hợp âm ba, âm giai và hợp âm bảy. Mỗi chế độ có năm cấp độ để tăng dần độ khó.',
          'Bài tập phù hợp cho người học piano, học sinh âm nhạc và người muốn nghe rõ hơn cấu trúc của giai điệu hoặc hòa âm.',
        ],
      },
      {
        heading: 'Cách bắt đầu dễ nhất',
        paragraphs: [
          'Hãy chọn một chế độ cho mỗi buổi luyện ngắn. Với người mới, nốt đơn và quãng dễ giúp hình thành mục tiêu nghe rõ ràng trước khi chuyển sang hợp âm hoặc âm giai.',
        ],
      },
      {
        heading: 'Âm thanh piano lấy mẫu',
        paragraphs: [
          'Ứng dụng dùng mẫu âm piano thay vì tiếng sóng đơn giản. Phần attack và decay tự nhiên giúp bài tập gần với trải nghiệm nghe nhạc cụ hơn.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Luyện cảm âm trên web có miễn phí không?',
        answer: 'Có. Bạn có thể sử dụng các chế độ hiện có mà không cần tạo tài khoản.',
      },
      {
        question: 'Người mới nên luyện phần nào trước?',
        answer: 'Nên bắt đầu với nốt đơn hoặc quãng ở cấp dễ rồi tăng dần độ khó.',
      },
      {
        question: 'Có cần cài ứng dụng không?',
        answer: 'Không. Perfect Pitch chạy trực tiếp trên trình duyệt hiện đại.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Bắt đầu luyện cảm âm',
    relatedPaths: ['/vi/luyen-nghe-not-nhac', '/vi/luyen-quang', '/vi/luyen-hop-am'],
    alternatePath: '/ear-training',
  },
  {
    path: '/vi/luyen-nghe-not-nhac',
    language: 'vi',
    locale: 'vi_VN',
    title: 'Luyện Nghe Nốt Nhạc Bằng Piano | Perfect Pitch',
    description:
      'Luyện nhận biết tên nốt nhạc bằng tai với tiếng piano thật, năm cấp độ và phản hồi đúng sai ngay sau mỗi câu trả lời.',
    eyebrow: 'Luyện nghe nốt nhạc',
    heading: 'Tập nhận biết tên nốt piano bằng tai',
    intro:
      'Bài tập phát một nốt piano và yêu cầu bạn chọn đúng tên cao độ. Mục tiêu là ghi nhớ màu sắc của từng tên nốt mà không cần nghe nốt tham chiếu trước.',
    sections: [
      {
        heading: 'Nhận biết tên nốt, không kiểm tra quãng tám',
        paragraphs: [
          'Chế độ nốt đơn chỉ chấm theo pitch class. Ví dụ C4 và C5 đều có đáp án là C, giúp bạn tập trung vào tên nốt thay vì vị trí quãng tám.',
        ],
      },
      {
        heading: 'Luyện ngắn và theo dõi lỗi',
        paragraphs: [
          'Bạn nên ghi nhận những cặp nốt thường nhầm và luyện ở một cấp độ ổn định trước khi tăng độ khó. Kết quả có thể khác nhau giữa mỗi người, vì vậy không nên xem cao độ tuyệt đối là lời hứa bắt buộc.',
        ],
      },
      {
        heading: 'Kết hợp với cao độ tương đối',
        paragraphs: [
          'Sau phần nốt đơn, hãy luyện quãng và giai điệu để phát triển khả năng nghe mối quan hệ giữa các nốt trong âm nhạc thực tế.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Ứng dụng có kiểm tra đúng quãng tám không?',
        answer: 'Không. Chế độ nốt đơn nhận biết tên nốt và không phân biệt quãng tám.',
      },
      {
        question: 'Người lớn có thể luyện nghe nốt không?',
        answer: 'Có. Người lớn có thể luyện trí nhớ cao độ và độ ổn định khi nhận biết nốt.',
      },
      {
        question: 'Luyện nốt có giống luyện quãng không?',
        answer: 'Không. Luyện nốt gọi tên một cao độ; luyện quãng nhận biết khoảng cách giữa hai nốt.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Bắt đầu luyện nghe nốt',
    relatedPaths: ['/vi/cao-do-tuyet-doi', '/vi/luyen-quang', '/vi/luyen-cam-am'],
    alternatePath: '/perfect-pitch-training',
  },
  {
    path: '/vi/luyen-quang',
    language: 'vi',
    locale: 'vi_VN',
    title: 'Luyện Nghe Quãng Nhạc Online | Perfect Pitch',
    description:
      'Luyện nhận biết quãng nhạc bằng tai với tiếng piano thật, bài tập quãng giai điệu và hòa âm, năm cấp độ và chấm điểm tức thì.',
    eyebrow: 'Luyện nghe quãng',
    heading: 'Nhận biết khoảng cách giữa hai nốt bằng tai',
    intro:
      'Quãng là khoảng cách giữa hai cao độ. Nghe rõ quãng hỗ trợ hát, chép nhạc, ứng tấu và nhận biết chuyển động của giai điệu.',
    sections: [
      {
        heading: 'Quãng giai điệu và quãng hòa âm',
        paragraphs: [
          'Hai nốt có thể được phát lần lượt hoặc đồng thời. Cách đầu giúp nghe hướng đi; cách sau giúp nhận biết màu sắc khi hai cao độ kết hợp.',
        ],
      },
      {
        heading: 'Nghe hướng trước, gọi tên sau',
        paragraphs: [
          'Trước tiên hãy xác định nốt thứ hai đi lên hay đi xuống, sau đó ước lượng khoảng cách nhỏ hay rộng. Cách chia bài toán này thường rõ ràng hơn việc đoán tên quãng ngay lập tức.',
        ],
      },
      {
        heading: 'Đưa quãng vào giai điệu',
        paragraphs: [
          'Sau khi luyện quãng, chuyển sang giai điệu ngắn để nghe cùng mối quan hệ đó trong một chuỗi âm nhạc dài hơn.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Luyện quãng có phải cao độ tương đối không?',
        answer: 'Đúng. Bài tập tập trung vào mối quan hệ giữa hai nốt thay vì tên một nốt độc lập.',
      },
      {
        question: 'Người mới nên bắt đầu từ quãng nào?',
        answer: 'Hãy dùng cấp dễ để làm quen với nhóm quãng cơ bản trước khi thêm quãng chromatic và quãng kép.',
      },
      {
        question: 'Có thể phát lại câu hỏi không?',
        answer: 'Có. Replay phát lại đúng dữ liệu của câu hiện tại.',
      },
    ],
    practiceMode: 'interval',
    practiceLabel: 'Bắt đầu luyện quãng',
    relatedPaths: ['/vi/luyen-cam-am', '/vi/luyen-hop-am', '/vi/luyen-nghe-not-nhac'],
    alternatePath: '/interval-ear-training',
  },
  {
    path: '/vi/luyen-hop-am',
    language: 'vi',
    locale: 'vi_VN',
    title: 'Luyện Nghe Hợp Âm Bằng Piano | Perfect Pitch',
    description:
      'Luyện nhận biết hợp âm trưởng, thứ, giảm và tăng bằng tai với tiếng piano lấy mẫu và phản hồi ngay sau khi chọn đáp án.',
    eyebrow: 'Luyện nghe hợp âm',
    heading: 'Nhận biết màu sắc hợp âm bằng tai',
    intro:
      'Chế độ hợp âm phát các nốt đồng thời để bạn nghe tổng thể hòa âm. Mỗi câu có bốn lựa chọn và hiển thị đúng sai ngay lần chọn đầu tiên.',
    sections: [
      {
        heading: 'Bắt đầu với trưởng và thứ',
        paragraphs: [
          'Ở cấp dễ, hãy tập trung vào khác biệt giữa hợp âm trưởng và thứ. Cấp cao hơn bổ sung hợp âm giảm, tăng, thế đảo và các đáp án gần nhau hơn.',
        ],
      },
      {
        heading: 'Nghe tổng thể trước từng nốt',
        paragraphs: [
          'Hãy nhận xét cảm giác ổn định, sáng, tối hoặc căng trước khi cố gắng tách từng nốt. Điều này giúp xây dựng trí nhớ về chất lượng hợp âm.',
        ],
      },
      {
        heading: 'Dùng rải hợp âm làm cầu nối',
        paragraphs: [
          'Chế độ arpeggio phát các nốt lần lượt, còn chế độ chord phát đồng thời. Luyện cả hai giúp kết nối nghe giai điệu với nghe hòa âm.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Ứng dụng có những loại hợp âm nào?',
        answer: 'Bài tập hợp âm ba gồm trưởng, thứ, giảm và tăng theo cấp độ.',
      },
      {
        question: 'Có hợp âm bảy không?',
        answer: 'Có. Hợp âm bảy được tách thành một chế độ riêng với bốn nốt.',
      },
      {
        question: 'Có nên luyện quãng trước không?',
        answer: 'Quãng là nền tảng hữu ích, nhưng người mới vẫn có thể bắt đầu bằng so sánh trưởng và thứ.',
      },
    ],
    practiceMode: 'chord',
    practiceLabel: 'Bắt đầu luyện hợp âm',
    relatedPaths: ['/vi/luyen-quang', '/vi/luyen-cam-am', '/vi/luyen-nghe-not-nhac'],
    alternatePath: '/chord-ear-training',
  },
  {
    path: '/vi/cao-do-tuyet-doi',
    language: 'vi',
    locale: 'vi_VN',
    title: 'Cao Độ Tuyệt Đối Là Gì? | Perfect Pitch',
    description:
      'Tìm hiểu cao độ tuyệt đối là gì, khác cao độ tương đối như thế nào và bài tập nhận biết nốt có thể hỗ trợ kỹ năng nghe ra sao.',
    eyebrow: 'Giải thích perfect pitch',
    heading: 'Cao độ tuyệt đối là gì?',
    intro:
      'Cao độ tuyệt đối, thường được gọi là perfect pitch, là khả năng nhận biết hoặc tạo ra một nốt nhạc mà không cần nghe nốt tham chiếu trước.',
    sections: [
      {
        heading: 'Khác với cao độ tương đối',
        paragraphs: [
          'Cao độ tuyệt đối gọi tên trực tiếp một nốt. Cao độ tương đối so sánh các nốt để nhận biết quãng, chuyển động giai điệu, màu sắc hợp âm hoặc âm giai.',
          'Nhiều nhạc sĩ giỏi chủ yếu dựa vào cao độ tương đối. Perfect pitch hữu ích nhưng không phải điều kiện bắt buộc để có năng lực âm nhạc tốt.',
        ],
      },
      {
        heading: 'Có thể luyện được điều gì?',
        paragraphs: [
          'Bài tập nhận biết nốt có thể cải thiện trí nhớ cao độ và độ ổn định khi trả lời. Kết quả giữa mỗi người khác nhau nên không nên hứa rằng mọi người đều đạt cao độ tuyệt đối.',
        ],
      },
      {
        heading: 'Luyện cả hai cách nghe',
        paragraphs: [
          'Chế độ nốt đơn hỗ trợ nhận biết tên nốt. Quãng, giai điệu, hợp âm và âm giai phát triển khả năng nghe quan hệ giữa các âm thanh.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Có cần cao độ tuyệt đối để trở thành nhạc sĩ giỏi không?',
        answer: 'Không. Cao độ tương đối, nhịp điệu, kỹ thuật và biểu cảm đều rất quan trọng.',
      },
      {
        question: 'Có thể đảm bảo luyện thành perfect pitch không?',
        answer: 'Không. Bài tập có thể cải thiện nhận biết nốt nhưng kết quả cá nhân không thể được đảm bảo.',
      },
      {
        question: 'Nên bắt đầu từ bài nào?',
        answer: 'Hãy bắt đầu với nốt đơn và quãng dễ, sau đó thêm giai điệu và hợp âm.',
      },
    ],
    practiceMode: 'single',
    practiceLabel: 'Thử nhận biết nốt',
    relatedPaths: ['/vi/luyen-nghe-not-nhac', '/vi/luyen-quang', '/vi/luyen-cam-am'],
    alternatePath: '/what-is-perfect-pitch',
  },
]

export const SEO_PAGE_BY_PATH = new Map(
  SEO_PAGES.map((page) => [page.path, page]),
)

export function getSeoPage(path: string) {
  return SEO_PAGE_BY_PATH.get(path) ?? null
}

export function getPracticeHref(page: SeoPageContent) {
  if (!page.practiceMode) {
    return '/#practice'
  }

  const params = new URLSearchParams({
    mode: page.practiceMode,
    source: page.path,
  })
  return `/?${params.toString()}`
}

export function getAbsoluteUrl(path: string) {
  return `${SITE_URL}${path === '/' ? '/' : path}`
}

export function getLanguageAlternates(page: SeoPageContent) {
  const alternates = [{ language: page.language, path: page.path }]
  if (page.alternatePath) {
    const alternate = getSeoPage(page.alternatePath)
    if (alternate) {
      alternates.push({ language: alternate.language, path: alternate.path })
    }
  }

  return alternates
}

export function getStructuredData(page?: SeoPageContent | null) {
  const websiteId = `${SITE_URL}/#website`
  const appId = `${SITE_URL}/#webapp`

  if (!page) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          inLanguage: ['en', 'vi'],
        },
        {
          '@type': 'WebApplication',
          '@id': appId,
          name: SITE_NAME,
          alternateName: 'Free online ear trainer',
          url: `${SITE_URL}/`,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          inLanguage: ['en', 'vi'],
          description: DEFAULT_DESCRIPTION,
          image: getAbsoluteUrl(SOCIAL_IMAGE_PATH),
          isAccessibleForFree: true,
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'USD',
          },
        },
      ],
    }
  }

  const pageUrl = getAbsoluteUrl(page.path)
  const hubPath = page.language === 'vi' ? '/vi/luyen-cam-am' : '/ear-training'
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: SITE_NAME,
      item: `${SITE_URL}/`,
    },
  ]

  if (page.path !== hubPath) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: page.language === 'vi' ? 'Luyện cảm âm' : 'Ear training',
      item: getAbsoluteUrl(hubPath),
    })
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: page.heading,
    item: pageUrl,
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebPage', 'LearningResource'],
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        inLanguage: page.language,
        isPartOf: { '@id': websiteId },
        about: { '@id': appId },
        learningResourceType: 'Practice guide',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumbs`,
        itemListElement: breadcrumbItems,
      },
    ],
  }
}
