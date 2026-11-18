import { DEMO_USER_ID, tx, type Db } from "./db";

interface SeedProfile {
  name: string;
  age: number;
  city: string;
  college: string;
  bio: string;
  interests: string[];
  gender: "women" | "men";
  portrait: number;
  likesDemo?: boolean;
}

const portrait = (g: "women" | "men", n: number) =>
  `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const extra = (name: string, n: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/\s/g, ""))}-${n}/600/800`;

// Order is intentionally mixed: likers are spread through the list, not clustered.
const PROFILES: SeedProfile[] = [
  { name: "Ananya Sharma", age: 21, city: "Delhi", college: "Delhi University", bio: "Literature major, chai evangelist. Will absolutely judge your playlist.", interests: ["Books", "Poetry", "Coffee", "Indie Music"], gender: "women", portrait: 44, likesDemo: true },
  { name: "Kabir Mehta", age: 22, city: "Mumbai", college: "St. Xavier's College", bio: "Street photographer. Looking for someone who walks slow and notices things.", interests: ["Photography", "Travel", "Cinema", "Street Food"], gender: "men", portrait: 32 },
  { name: "Riya Kapoor", age: 20, city: "Bengaluru", college: "Christ University", bio: "Psych student by day, amateur baker by night. Ask me about sourdough.", interests: ["Baking", "Psychology", "Yoga", "Podcasts"], gender: "women", portrait: 65 },
  { name: "Arjun Nair", age: 23, city: "Kochi", college: "IIT Madras", bio: "Mechanical engineer who plays too much football and too little guitar.", interests: ["Football", "Guitar", "Travel", "Startups"], gender: "men", portrait: 12, likesDemo: true },
  { name: "Isha Verma", age: 22, city: "Pune", college: "Symbiosis", bio: "Design nerd. I rearrange furniture when stressed.", interests: ["Design", "Thrifting", "Cinema", "Coffee"], gender: "women", portrait: 22 },
  { name: "Rohan Desai", age: 24, city: "Ahmedabad", college: "NID", bio: "Typography is my love language. Fluent in sarcasm and Gujarati snacks.", interests: ["Design", "Street Food", "Cycling", "Board Games"], gender: "men", portrait: 45 },
  { name: "Meera Iyer", age: 21, city: "Chennai", college: "Loyola College", bio: "Bharatanatyam since age 6. Occasionally unserious, always on time.", interests: ["Dance", "Carnatic Music", "Books", "Travel"], gender: "women", portrait: 33, likesDemo: true },
  { name: "Dev Malhotra", age: 22, city: "Delhi", college: "Delhi University", bio: "Debate society veteran. I will argue pineapple on pizza both ways.", interests: ["Debate", "Stand-up Comedy", "Football", "Podcasts"], gender: "men", portrait: 61 },
  { name: "Saanvi Reddy", age: 20, city: "Hyderabad", college: "BITS Hyderabad", bio: "CS + climbing. Currently training for a half marathon I regret signing up for.", interests: ["Climbing", "Running", "Coding", "Indie Music"], gender: "women", portrait: 12 },
  { name: "Aditya Joshi", age: 23, city: "Pune", college: "Symbiosis", bio: "Finance student with a secret poetry notebook. Don't tell anyone.", interests: ["Poetry", "Chess", "Coffee", "Cricket"], gender: "men", portrait: 75 },
  { name: "Tara Bose", age: 22, city: "Kolkata", college: "Presidency University", bio: "History nerd, rooftop addict, terrible at small talk, great at long ones.", interests: ["History", "Photography", "Books", "Street Food"], gender: "women", portrait: 54, likesDemo: true },
  { name: "Vikram Singh", age: 24, city: "Chandigarh", college: "Panjab University", bio: "Bike rides at 5am, parathas at 9am. Balanced.", interests: ["Motorcycles", "Fitness", "Travel", "Street Food"], gender: "men", portrait: 18 },
  { name: "Nisha Patel", age: 21, city: "Ahmedabad", college: "CEPT University", bio: "Architecture student. I judge buildings, not people. Mostly.", interests: ["Architecture", "Sketching", "Cinema", "Cycling"], gender: "women", portrait: 3 },
  { name: "Karan Bhatia", age: 22, city: "Mumbai", college: "NMIMS", bio: "Founder of two failed startups and one decent meme page.", interests: ["Startups", "Stand-up Comedy", "Gaming", "Fitness"], gender: "men", portrait: 90, likesDemo: true },
  { name: "Pooja Menon", age: 23, city: "Kochi", college: "IIT Madras", bio: "Marine biology dreamer stuck in a robotics lab. Beaches are therapy.", interests: ["Travel", "Marine Life", "Coding", "Yoga"], gender: "women", portrait: 8 },
  { name: "Ishaan Gupta", age: 21, city: "Delhi", college: "IIT Delhi", bio: "Quant brain, tabla hands. Will split the bill and the last samosa.", interests: ["Tabla", "Chess", "Coding", "Street Food"], gender: "men", portrait: 27 },
  { name: "Zoya Khan", age: 22, city: "Lucknow", college: "Lucknow University", bio: "Journalism student. Collects vintage postcards and unsolicited opinions.", interests: ["Journalism", "Books", "Thrifting", "Poetry"], gender: "women", portrait: 78, likesDemo: true },
  { name: "Neil D'Souza", age: 23, city: "Goa", college: "Goa University", bio: "Surf instructor on weekends, marine law student on weekdays.", interests: ["Surfing", "Travel", "Indie Music", "Cooking"], gender: "men", portrait: 50 },
  { name: "Aarohi Kulkarni", age: 20, city: "Pune", college: "Fergusson College", bio: "Theatre kid forever. Will narrate your life if you let me.", interests: ["Theatre", "Cinema", "Dance", "Poetry"], gender: "women", portrait: 91 },
  { name: "Samar Qureshi", age: 24, city: "Hyderabad", college: "BITS Hyderabad", bio: "Biryani connoisseur and part-time pianist. Strong opinions on dum vs. pakki.", interests: ["Piano", "Cooking", "Cricket", "Gaming"], gender: "men", portrait: 6, likesDemo: true },
  { name: "Diya Chatterjee", age: 21, city: "Kolkata", college: "Jadavpur University", bio: "Physics, adda, and rain. In that order, depending on the weather.", interests: ["Physics", "Books", "Photography", "Coffee"], gender: "women", portrait: 17 },
  { name: "Yash Agarwal", age: 22, city: "Jaipur", college: "MNIT Jaipur", bio: "Hackathon regular. Sleep optional. Chai mandatory.", interests: ["Coding", "Startups", "Football", "Gaming"], gender: "men", portrait: 38 },
  { name: "Kavya Rao", age: 22, city: "Bengaluru", college: "Christ University", bio: "UX researcher in training. I ask a lot of 'why?' on first dates.", interests: ["Design", "Psychology", "Hiking", "Podcasts"], gender: "women", portrait: 29, likesDemo: true },
  { name: "Rahul Pillai", age: 23, city: "Kochi", college: "Cochin University", bio: "Mallu film buff with a weakness for Sunday biryani and sad songs.", interests: ["Cinema", "Football", "Travel", "Guitar"], gender: "men", portrait: 82 },
  { name: "Simran Kaur", age: 21, city: "Chandigarh", college: "Panjab University", bio: "Law student, kirtan singer, accidental gym person.", interests: ["Fitness", "Music", "Debate", "Cooking"], gender: "women", portrait: 36 },
  { name: "Tanmay Ghosh", age: 24, city: "Kolkata", college: "Presidency University", bio: "Economics and Bengali rock. I'll teach you to bargain at New Market.", interests: ["Indie Music", "Cricket", "Books", "Street Food"], gender: "men", portrait: 65 },
  { name: "Aisha Siddiqui", age: 22, city: "Mumbai", college: "St. Xavier's College", bio: "Film studies. I quote movies at inappropriate times.", interests: ["Cinema", "Photography", "Thrifting", "Coffee"], gender: "women", portrait: 70, likesDemo: true },
  { name: "Harsh Vardhan", age: 22, city: "Jaipur", college: "MNIT Jaipur", bio: "Cycling the Aravallis on weekends. Surprisingly good at karaoke.", interests: ["Cycling", "Hiking", "Karaoke", "Coding"], gender: "men", portrait: 2 },
  { name: "Mahika Jain", age: 20, city: "Delhi", college: "IIT Delhi", bio: "Chemical engineering. Crochet in lectures, fight me.", interests: ["Crochet", "Board Games", "Baking", "Podcasts"], gender: "women", portrait: 84 },
  { name: "Aryan Thakur", age: 23, city: "Bengaluru", college: "IISc", bio: "Researching neural nets, losing to them at chess.", interests: ["Chess", "Running", "Coding", "Coffee"], gender: "men", portrait: 41 },
  { name: "Navya Hegde", age: 21, city: "Mangaluru", college: "St Aloysius College", bio: "Seafood loyalist, sunset chaser, mediocre ukulele player.", interests: ["Ukulele", "Cooking", "Travel", "Yoga"], gender: "women", portrait: 59 },
  { name: "Rishi Banerjee", age: 22, city: "Kolkata", college: "Jadavpur University", bio: "Aspiring director. Will cast you in my short film if the chemistry reads.", interests: ["Cinema", "Photography", "Theatre", "Cycling"], gender: "men", portrait: 24 },
];

const DEMO = {
  name: "Aarav Singh",
  age: 22,
  city: "Delhi",
  college: "Delhi University",
  bio: "That's you.",
  gender: "men" as const,
  portrait: 11,
};

export function seedIfEmpty(db: Db): void {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (n > 0) return;
  seed(db);
}

export function seed(db: Db): void {
  tx(db, () => {
    const insertUser = db.prepare(
      "INSERT INTO users (name, age, bio, city, college, is_demo) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertPhoto = db.prepare(
      "INSERT INTO user_photos (user_id, url, position) VALUES (?, ?, ?)",
    );
    const insertInterest = db.prepare("INSERT OR IGNORE INTO interests (name) VALUES (?)");
    const linkInterest = db.prepare(
      "INSERT INTO user_interests (user_id, interest_id) SELECT ?, id FROM interests WHERE name = ?",
    );
    const insertSwipe = db.prepare(
      "INSERT INTO swipes (swiper_id, target_id, action) VALUES (?, ?, 'like')",
    );

    // Demo user is always id 1 because it's inserted first into an empty table.
    const demoId = Number(
      insertUser.run(DEMO.name, DEMO.age, DEMO.bio, DEMO.city, DEMO.college, 1).lastInsertRowid,
    );
    if (demoId !== DEMO_USER_ID) throw new Error("Demo user must have id 1");
    insertPhoto.run(demoId, portrait(DEMO.gender, DEMO.portrait), 0);

    for (const p of PROFILES) {
      const id = Number(insertUser.run(p.name, p.age, p.bio, p.city, p.college, 0).lastInsertRowid);
      insertPhoto.run(id, portrait(p.gender, p.portrait), 0);
      insertPhoto.run(id, extra(p.name, 1), 1);
      insertPhoto.run(id, extra(p.name, 2), 2);
      for (const interest of p.interests) {
        insertInterest.run(interest);
        linkInterest.run(id, interest);
      }
      // Private "already liked you" signal. Never exposed by any API.
      if (p.likesDemo) insertSwipe.run(id, demoId);
    }
  });
}
