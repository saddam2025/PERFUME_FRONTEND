import { useLanguage } from "../context/LanguageContext";

export default function About() {
  const { locale } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink mb-8 text-center">
        {locale === "ar" ? "عن العلامة" : "About the Brand"}
      </h1>
      
      <div className="space-y-6 text-sm leading-relaxed text-slate">
        <p className="text-base text-ink font-semibold">
          {locale === "ar" 
            ? "أنا عبد الرحمن محسن \"صدام\"، مؤسس العلامة." 
            : "I’m Abdelrahman Mohsen “Saddam”, the founder of the brand."}
        </p>

        <p>
          {locale === "ar"
            ? "بدأت العلامة برؤية واضحة: تقديم عطور مختارة بعناية تعبّر عن الشخصية، مع اهتمام حقيقي بالتفاصيل والجودة. نطمح لبناء وجهة عطرية لها هويتها الخاصة وأثرها الذي يدوم."
            : "I started the brand with a clear vision: to offer carefully selected fragrances with character, supported by a genuine attention to detail and quality. We aim to build a fragrance destination with a distinct identity and a lasting impression."}
        </p>
        
        <p>
          {locale === "ar"
            ? "بدأت رحلتنا باختيار عطور من علامات موثوقة، وما زلنا نبحث عن الروائح التي تستحق أن تصبح جزءًا من يومك. ومع كل عطر نقدمه، تظل الجودة والاختيار المدروس أساس تجربتنا:"
            : "Our journey began by selecting fragrances from trusted brands, and we continue to seek scents worthy of becoming part of your day. With every perfume we offer, quality and thoughtful selection remain at the heart of the experience:"}
        </p>

        <div className="border-s-2 border-line ps-6 py-2 italic bg-paper-dim font-medium text-ink">
          {locale === "ar"
            ? "مش بنقدم غير الأفضل دايماً."
            : "We only deliver the best."}
        </div>

        <p>
          {locale === "ar"
            ? "علامتنا لكل من يقدّر العطور المميزة والجودة والروائح التي تعبّر عنه."
            : "Our brand is for people who value distinctive fragrances, quality, and scents that feel personal."}
        </p>

        <p>
          {locale === "ar"
            ? "رأيكم جزء مهم من رحلتنا. شاركونا تفضيلاتكم واقتراحاتكم، وساعدونا في اكتشاف الروائح التي تحبونها."
            : "Your feedback matters to us. Share your fragrance preferences and suggestions, and help us discover the scents you love."}
        </p>

        <p className="text-ink font-semibold pt-2">
          {locale === "ar"
            ? "ودي مجرد البداية بس.. خليكم متابعين! "
            : "This is only the beginning. Stay tuned."}
        </p>
      </div>
    </div>
  );
}
