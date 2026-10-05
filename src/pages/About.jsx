import { useLanguage } from "../context/LanguageContext";

export default function About() {
  const { locale } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink mb-8 text-center">
        {locale === "ar" ? "عن تورونتو" : "About Toronto"}
      </h1>
      
      <div className="space-y-6 text-sm leading-relaxed text-slate">
        <p className="text-base text-ink font-semibold">
          {locale === "ar" 
            ? "أنا عبد الرحمن محسن \"صدام\"، مؤسس تورونتو." 
            : "I’m Abdelrahman Mohsen “Saddam”, the founder of Toronto."}
        </p>

        <p>
          {locale === "ar"
            ? "بدأت تورونتو لأني كنت مؤمن إني أقدر أقدم حاجة مختلفة—حاجة بتعبر عن رؤيتي الخاصة، واهتمامي بالتفاصيل، وشغفي بالجودة. البراند ده مش مجرد بيع منتجات؛ الموضوع أكبر من كده، إحنا بنبني كيان بهوية واضحة وعايزين نسيب بصمة حقيقية تدوم."
            : "I started Toronto because I believed I could create something different—something that reflects my own vision, attention to detail, and passion for quality. This brand isn’t just about selling products; it’s about building something with a clear identity and leaving a lasting mark."}
        </p>
        
        <p>
          {locale === "ar"
            ? "رحلتنا بدأت كستور بيختار كل قطعة بعناية فائقة، وعندنا هدف واحد واضح: إننا نكبر ونتحول لبراند بيصمم ويصنع منتجاته بنفسه بالكامل. وسواء كنا بنختار أفضل القطع من شركاء بنثق فيهم حالياً، أو بنصنع كولكشنز خاصة بينا في المستقبل، في حاجة واحدة عمرها ما هتتغير:"
            : "Our journey begins as a carefully curated store, with one goal in mind: to grow into a brand that designs and manufactures its own products. Whether we’re selecting the finest pieces from trusted partners or creating our own collections in the future, one thing will never change:"}
        </p>

        <div className="border-s-2 border-line ps-6 py-2 italic bg-paper-dim font-medium text-ink">
          {locale === "ar"
            ? "مش بنقدم غير الأفضل دايماً."
            : "We only deliver the best."}
        </div>

        <p>
          {locale === "ar"
            ? "تورونتو اتعملت عشان الناس اللي بتقدر الجودة، البساطة، والمنتجات اللي يقدروا يثقوا فيها بجد."
            : "Toronto is built for people who appreciate quality, simplicity, and products they can trust."}
        </p>

        <p>
          {locale === "ar"
            ? "رأيكم وتعليقاتكم جزء أساسي ومهم جداً من الرحلة دي. لو عندكم أي أفكار، اقتراحات، أو تعليقات، متترددوش إنكم تشاركوها معانا. إحنا بنبني تورونتو مع بعض."
            : "Your feedback is an important part of this journey. If you have any ideas, suggestions, or comments, don’t hesitate to share them with us. We’re building Toronto together."}
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