// app/lib/constants.ts
import { FaBook, FaSchool, FaMosque, FaChild, FaBrain, FaUndo, FaBookOpen, FaPuzzlePiece, FaPencilRuler, FaLanguage } from 'react-icons/fa';
import { FaTh } from 'react-icons/fa';

export const COLLECTION_PRODUCTS = 'products';
export const COLLECTION_ORDERS = 'orders';

export const CATEGORIES = [
    {
        id: 'all',
        name: 'الكل',
        icon: FaTh,
    },
    {
        id: 'external-books',
        name: 'كتب خارجيه',
        icon: FaBook,
    },
    {
        id: 'school-books',
        name: 'كتب مدرسيه',
        icon: FaSchool,
    },
    {
        id: 'azhar-books',
        name: 'كتب ازهرى',
        icon: FaMosque,
    },
    {
        id: 'foundation-books',
        name: 'كتب تأسيس',
        icon: FaChild,
    },
    {
        id: 'kids-skills-books',
        name: 'كتب تنميه مهارات اطفال',
        icon: FaBrain,
    },
    {
        id: 'returned-books',
        name: 'كتب مرتجع',
        icon: FaUndo,
    },
    {
        id: 'kids-stories',
        name: 'قصص اطفال',
        icon: FaBookOpen,
    },
    {
        id: 'montessori-toys',
        name: 'العاب تنمية مهارات اطفال منتسورى',
        icon: FaPuzzlePiece,
    },
    {
        id: 'stationery',
        name: 'ادوات مدرسيه ومكتبيه',
        icon: FaPencilRuler,
    },
    {
        id: 'language-level-books',
        name: 'كتب مستوى لغات',
        icon: FaLanguage,
    },
];
