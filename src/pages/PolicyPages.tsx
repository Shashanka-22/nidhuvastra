import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BRAND } from '../data/brand';

const PolicyShell: React.FC<{
  kicker: string;
  title: string;
  children: React.ReactNode;
}> = ({ kicker, title, children }) => (
  <div className="mx-auto max-w-3xl px-4 sm:px-8 py-12 sm:py-16">
    <div className="border-b border-[#242020]/10 pb-6 mb-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">{kicker}</p>
      <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
        {title}
      </h1>
    </div>
    <div className="bg-white border border-[#242020]/10 p-6 sm:p-10 space-y-6 text-sm sm:text-[15px] leading-relaxed text-[#5C5252]">
      {children}
    </div>
  </div>
);

export const ShippingPolicyPage: React.FC = () => (
  <PolicyShell kicker="Customer Care" title="Shipping Policy">
    <p>
      At NidhuVastra, we take great care in ensuring your sarees are packaged securely and delivered safely across India.
    </p>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Shipping Area</h2>
      <p>
        We currently ship across all serviceable PIN codes within India. International shipping is not available at this time.
      </p>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Shipping Charges</h2>
      <p>
        We are delighted to offer <strong>FREE shipping</strong> across India on all orders.
      </p>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Dispatch &amp; Delivery Timelines
      </h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Orders are dispatched within 2–3 business days of confirmation.</li>
        <li>Delivery typically takes 3–4 business days after dispatch, depending on your location.</li>
        <li>Tracking details are provided once your order is dispatched.</li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Important Notes</h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Delivery timelines may vary due to courier delays, festive seasons, or remote locations.</li>
        <li>Please ensure that shipping details provided at checkout are accurate to avoid delays.</li>
        <li>
          If a package is missing or delivered to a location not mentioned in your provided shipping information, resolutions are processed only through the delivery partner.
        </li>
      </ul>
    </div>
  </PolicyShell>
);

export const ReturnPolicyPage: React.FC = () => (
  <PolicyShell kicker="Customer Care" title="Returns & Exchange Policy">
    <p>
      At NidhuVastra, we take great care in inspecting every saree before dispatch. In the unlikely event that you receive a damaged, defective, or incorrect item, our Returns &amp; Exchange Policy applies as follows:
    </p>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        1. Eligibility for Exchanges
      </h2>
      <p className="font-medium text-[#242020]">Exchanges are accepted only in cases of:</p>
      <ul className="list-disc pl-5 space-y-1 mt-1.5">
        <li>Products damaged during shipping.</li>
        <li>Manufacturing defects.</li>
        <li>Incorrect item sent.</li>
      </ul>
      <p className="mt-2">
        Exchange requests must be submitted within <strong>2 days of delivery</strong> of the saree.
      </p>
      <p className="mt-2 font-medium text-[#242020]">Returns/Exchanges are not accepted for:</p>
      <ul className="list-disc pl-5 space-y-1 mt-1">
        <li>Change of mind.</li>
        <li>Size or colour preference.</li>
        <li>General dissatisfaction with the product.</li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        2. Mandatory Evidence Requirement
      </h2>
      <p>To process any exchange request, you must provide:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-1.5">
        <li>An unedited unboxing video clearly showing the parcel opening and the damage/issue.</li>
        <li>Clear photographs of the damaged or defective product.</li>
        <li>Your Order Number and Product Code.</li>
      </ul>
      <p className="mt-2 text-[#641E32] font-medium">
        Important: Requests without an unboxing video will not be considered.
      </p>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        3. How to Report a Damaged or Incorrect Product
      </h2>
      <p>Please submit your request using our official Return/Exchange Request Form:</p>
      <a
        href={BRAND.returnFormUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 bg-[#641E32] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424]"
      >
        <span>Open Return / Exchange Form</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        4. Review &amp; Processing Timeline
      </h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>All requests are reviewed within 24 hours of submission.</li>
        <li>Approval is granted only after verification of the submitted evidence.</li>
        <li>Approved exchanges are dispatched within 3–4 business days after approval.</li>
        <li>
          <strong>Please note:</strong> We do not offer refunds; only eligible product exchanges are initiated.
        </li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">5. Assistance</h2>
      <p>
        For questions regarding exchanges, please contact us at{' '}
        <a href={`mailto:${BRAND.email}`} className="text-[#641E32] font-medium hover:underline">
          {BRAND.email}
        </a>{' '}
        or {BRAND.phone}.
      </p>
    </div>
  </PolicyShell>
);

export const PrivacyPolicyPage: React.FC = () => (
  <PolicyShell kicker="Legal & Privacy" title="Privacy Policy">
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Information We Collect
      </h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Name, email, phone number, billing and shipping addresses.</li>
        <li>
          Order details and payment information (processed securely through third-party gateways; not stored by us).
        </li>
        <li>Photos or unboxing videos provided for return/exchange verification.</li>
        <li>Technical data such as IP address, browser type, device info, and cookies for analytics.</li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        How We Use Your Information
      </h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To process and deliver orders.</li>
        <li>To provide customer support.</li>
        <li>To verify product exchange requests (including unboxing video proof).</li>
        <li>To send order updates and service notifications.</li>
        <li>To improve our website and services.</li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Sharing of Information
      </h2>
      <p>We do not sell or rent personal data. Information is shared only with:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-1.5">
        <li>Payment processors (to complete secure transactions).</li>
        <li>Delivery partners (to ship your order).</li>
        <li>Service providers (for hosting, analytics, or support).</li>
        <li>Legal authorities if required by law.</li>
      </ul>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Cookies</h2>
      <p>
        Our website may use cookies and browser storage to remember your shopping bag, wishlist, and enhance functionality. You may disable cookies in your browser, though some features may be affected.
      </p>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Data Retention</h2>
      <p>
        Your data is retained only as long as necessary to complete your order, handle exchanges, and comply with legal obligations.
      </p>
    </div>

    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">Your Rights</h2>
      <p>
        You may request access, correction, or deletion of your data by contacting us at{' '}
        <a href={`mailto:${BRAND.email}`} className="text-[#641E32] font-medium hover:underline">
          {BRAND.email}
        </a>
        .
      </p>
    </div>
  </PolicyShell>
);

export const TermsPage: React.FC = () => (
  <PolicyShell kicker="Legal & Store Guidelines" title="Terms & Conditions">
    <p>
      Welcome to NidhuVastra ({BRAND.address}). By accessing or placing an order through our website, you agree to the following terms governing purchases and customer service.
    </p>
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Products &amp; Pricing
      </h2>
      <p>
        All saree prices are listed in Indian Rupees (INR) inclusive of applicable taxes. Minor variations in weave texture or screen-to-fabric colour tone may occur due to photographic lighting and handcrafted dyeing processes.
      </p>
    </div>
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Orders, Shipping &amp; Exchanges
      </h2>
      <p>
        Orders are dispatched across serviceable Indian PIN codes within 2–3 business days and are governed by our Shipping Policy and Returns &amp; Exchange Policy (exchange only with mandatory unboxing video within 2 days of delivery).
      </p>
    </div>
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Intellectual Property
      </h2>
      <p>
        All NidhuVastra product photographs, brand marks, and editorial copy remain the property of NidhuVastra.
      </p>
    </div>
  </PolicyShell>
);

export const AccessibilityPage: React.FC = () => (
  <PolicyShell kicker="Commitment to All Guests" title="Accessibility Statement">
    <p>
      NidhuVastra is committed to ensuring our online boutique is accessible to all visitors, including customers using assistive technologies and keyboard navigation.
    </p>
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Accessibility Measures
      </h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Semantic HTML landmarks, descriptive heading hierarchy, and clear focus indicators.</li>
        <li>Alternative text descriptions on product and editorial saree photography.</li>
        <li>High-contrast typography adhering to WCAG 2.1 AA contrast standards.</li>
        <li>Support for reduced-motion preferences across transitions and hover states.</li>
      </ul>
    </div>
    <div>
      <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-2">
        Feedback &amp; Assistance
      </h2>
      <p>
        If you experience any difficulty browsing or placing an order, please reach out to us at{' '}
        <a href={`mailto:${BRAND.email}`} className="text-[#641E32] font-medium hover:underline">
          {BRAND.email}
        </a>{' '}
        or call/WhatsApp {BRAND.phone} ({BRAND.hours}).
      </p>
    </div>
  </PolicyShell>
);
