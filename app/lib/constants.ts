import { FaBook, FaSchool, FaMosque, FaChild, FaBrain, FaUndo, FaBookOpen, FaPuzzlePiece, FaPencilRuler, FaLanguage, FaTh } from 'react-icons/fa';

// 🎯 أولاً: تعريف الروابط الصحيحة في مكان واحد
export const SITE_LINKS = {
  facebook: "https://www.facebook.com/maktabat.dar.allughat/",
  whatsapp: "https://chat.whatsapp.com/LoAtW84xgZr51vQAbSEw0E",
  telegram: "https://t.me/+10C-njs5Xoo0ZDRk",
  googleMaps: "https://www.google.com/maps/place/%D9%85%D9%83%D8%AA%D8%A8%D8%A7%D8%AA+%D8%AF%D8%A7%D8%B1+%D8%A7%D9%84%D9%84%D8%BA%D8%A7%D8%AA+%D9%81%D8%B1%D8%B9+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1%E2%80%AD/@30.2005385,31.4687448,17z/data=!3m1!4b1!4m6!3m5!1s0x14581b00678ba35d:0x409f8c8e3314ed66!8m2!3d30.2005385!4d31.4665561!16s%2Fg%2F11yry7h42m?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D",
  phone: "01220396597"
};

export const COLLECTION_PRODUCTS = 'products';
export const COLLECTION_ORDERS = 'orders';

// 🎯 ثانياً: استخدام تعديلك الممتاز للأقسام
export const CATEGORIES = [
    {
        id: 'all',
        name: 'الكل',
        icon: FaTh,
        ariaLabel: 'عرض جميع المنتجات المتاحة في المكتبة',
        mcpCategory: 'all-products'
    },
    {
        id: 'external-books',
        name: 'كتب خارجيه',
        icon: FaBook,
        ariaLabel: 'قسم الكتب الخارجية للمناهج الدراسية',
        mcpCategory: 'educational-materials'
    },
    {
        id: 'school-books',
        name: 'كتب مدرسيه',
        icon: FaSchool,
        ariaLabel: 'قسم الكتب المدرسية الرسمية',
        mcpCategory: 'textbooks'
    },
    {
        id: 'azhar-books',
        name: 'كتب ازهرى',
        icon: FaMosque,
        ariaLabel: 'قسم كتب المناهج الأزهرية والشرعية',
        mcpCategory: 'religious-educational'
    },
    {
        id: 'foundation-books',
        name: 'كتب تأسيس',
        icon: FaChild,
        ariaLabel: 'كتب مرحلة تأسيس الأطفال والقراءة والكتابة',
        mcpCategory: 'early-learning'
    },
    {
        id: 'kids-skills-books',
        name: 'كتب تنميه مهارات اطفال',
        icon: FaBrain,
        ariaLabel: 'كتب تنمية الذكاء والمهارات الفكرية للأطفال',
        mcpCategory: 'cognitive-development'
    },
    {
        id: 'returned-books',
        name: 'كتب مرتجع',
        icon: FaUndo,
        ariaLabel: 'كتب مستعملة أو مرتجعة بحالة ممتازة بأسعار مخفضة',
        mcpCategory: 'discounted-books'
    },
    {
        id: 'kids-stories',
        name: 'قصص اطفال',
        icon: FaBookOpen,
        ariaLabel: 'قصص وروايات مصورة مخصصة للأطفال',
        mcpCategory: 'children-fiction'
    },
    {
        id: 'montessori-toys',
        name: 'العاب تنمية مهارات اطفال منتسورى',
        icon: FaPuzzlePiece,
        ariaLabel: 'ألعاب تعليمية ووسائل منتسوري لتنمية مهارات الطفل ذهنياً وحركياً',
        mcpCategory: 'educational-toys'
    },
    {
        id: 'stationery',
        name: 'ادوات مدرسيه ومكتبيه',
        icon: FaPencilRuler,
        ariaLabel: 'قسم الأدوات المكتبية، الكشاكيل، والأقلام المدرسية',
        mcpCategory: 'school-supplies'
    },
    {
        id: 'language-level-books',
        name: 'كتب مستوى لغات',
        icon: FaLanguage,
        ariaLabel: 'كتب ومناهج المدارس التجريبية واللغات والإنترناشونال',
        mcpCategory: 'foreign-language-curriculum'
    },
];