export const BRAND = {
  name: 'NIDHUVASTRA',
  tagline: 'Weaving Threads of Tradition with Contemporary Elegance.',
  phone: '+91 8861162769',
  phoneRaw: '918861162769',
  email: 'nidhuvastra@gmail.com',
  hours: 'Monday–Saturday, 10 AM–6 PM IST',
  address: 'Mysuru, Karnataka, India – 570017',
  instagram: 'https://www.instagram.com/nidhu_vastra/profilecard/?igsh=MWI0bHRqc3ZlZTk4bg==',
  whatsappUrl: 'https://wa.me/918861162769?text=Hello%20NidhuVastra%2C%20I%20would%20like%20assistance%20with%20a%20saree%20order.',
  returnFormUrl: 'https://forms.gle/TYCh4GTD4rRfkseD6',
  dtdcTrackUrl: 'https://www.dtdc.in/trace.asp',
  existingSiteUrl: 'https://www.nidhuvastra.com/',
};

export const BRAND_ASSETS = {
  logoId: '01d5f4_0509c581a21c497588f86eb8cf0e0086~mv2.jpg',
  emblemId: '01d5f4_3fa8134d7f824d4389228afb4ce4e304~mv2.png',
  faviconId: '01d5f4_4c5acccb68374a898e3735a4c7d7847b~mv2.jpg',
  heroBannerId: '01d5f4_e8e6e82bdc414a848b23c5cdb5c2da85~mv2.jpg',
  editorialPrimaryId: '01d5f4_89308495e5c64791ba376b2a0dab45d6~mv2.jpg',
  editorialSecondaryId: '01d5f4_095807ccfa864bd4a975ea2e0b40a30f~mv2.jpg',
  editorialTertiaryId: '01d5f4_9eba231e7146468683e31817905059ac~mv2.jpg',
  editorialQuaternaryId: '01d5f4_1beb80310ec541d9878cbe4a0a4463ee~mv2.jpg',
  aboutPrimaryId: '01d5f4_cf4d304aebbc49759672c906fc3f1b4a~mv2.jpg',
  aboutSecondaryId: '01d5f4_77c4e832971c4222a0650594140da485~mv2.jpg',
  howToOrderPosterId: '01d5f4_762cac2cca004943bd3b773f0283761df002.jpg',
  showcaseReelMp4: 'https://video.wixstatic.com/video/01d5f4_380ce5fb21204081b6bc96af2c5f65dd/720p/mp4/file.mp4',
};

export function wixImageUrl(mediaId: string, width = 800, height = 1067, quality = 88): string {
  if (!mediaId) return '';
  if (mediaId.startsWith('http://') || mediaId.startsWith('https://')) {
    return mediaId;
  }
  const ext = mediaId.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  return `https://static.wixstatic.com/media/${mediaId}/v1/fit/w_${width},h_${height},q_${quality}/file.${ext}`;
}

export function wixOriginalUrl(mediaId: string): string {
  if (!mediaId) return '';
  if (mediaId.startsWith('http://') || mediaId.startsWith('https://')) {
    return mediaId;
  }
  return `https://static.wixstatic.com/media/${mediaId}`;
}

export interface CollectionMeta {
  slug: string;
  name: string;
  subtitle: string;
  featuredOnHome: boolean;
}

export const COLLECTIONS: CollectionMeta[] = [
  {
    slug: 'banarasi-sarees',
    name: 'Banarasi Sarees',
    subtitle: 'Opulent zari brocade & woven heirloom motifs',
    featuredOnHome: true,
  },
  {
    slug: 'cotton-sarees',
    name: 'Cotton Sarees',
    subtitle: 'Breathable handloom weaves for everyday grace',
    featuredOnHome: true,
  },
  {
    slug: 'kanjivaram-sarees',
    name: 'Kanjivaram Sarees',
    subtitle: 'Temple borders & rich traditional silk craftsmanship',
    featuredOnHome: true,
  },
  {
    slug: 'mysore-semi-crepe-silk',
    name: 'Mysore Semi Crepe Silk',
    subtitle: 'Fluid drape with timeless Karnataka artistry',
    featuredOnHome: true,
  },
  {
    slug: 'mysore-silk-sarees',
    name: 'Mysore Silk Sarees',
    subtitle: 'Lustrous heritage drapes from the heart of Mysuru',
    featuredOnHome: true,
  },
  {
    slug: 'khadi-cotton',
    name: 'Khadi Cotton',
    subtitle: 'Artisanal hand-spun texture with quiet elegance',
    featuredOnHome: true,
  },
  {
    slug: 'tissue-silk-sarees',
    name: 'Tissue Silk Sarees',
    subtitle: 'Luminous metallic sheen for festive celebrations',
    featuredOnHome: true,
  },
  {
    slug: 'satin-sarees',
    name: 'Satin Sarees',
    subtitle: 'Silky contemporary drape & rich artisanal prints',
    featuredOnHome: true,
  },
  {
    slug: 'fancy-sarees',
    name: 'Fancy & Designer Sarees',
    subtitle: 'Statement prints & contemporary festive silhouettes',
    featuredOnHome: false,
  },
  {
    slug: 'georgette-sarees',
    name: 'Georgette Sarees',
    subtitle: 'Featherlight fall with intricate detailing',
    featuredOnHome: false,
  },
  {
    slug: 'soft-silk-sarees',
    name: 'Soft Silk & Tassar',
    subtitle: 'Supple weave comfort with celebratory lustre',
    featuredOnHome: false,
  },
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
