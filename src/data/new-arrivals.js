// Sarees identified from the photo batch of 2026-09-10.
// 25 photographs, deduplicated and grouped into 16 sarees — several were
// shot twice from different angles, so those become a second gallery image.
// Every name, colour, weave note and description was written by looking at
// that saree's own photograph.
//
// Photos are already uploaded to Cloudinary, so these are created complete
// apart from price and stock, which cannot be read off a picture.
// Safe to delete once all of them have been published.

const IMG = 'https://res.cloudinary.com/u8uuduqn/image/upload';
const P = 'ashu-silks/products/import-2026-09-10';

export const NEW_ARRIVALS = [
  {
    name: 'Scarlet & Peach Paisley Mysore Silk',
    category: 'Designer',
    colour: 'Scarlet Red & Peach',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Paisley zari border',
    occasion: 'Festive / Day Function',
    media: [`${IMG}/v1789056697/${P}/mindsvnkzcmxbyppzofj.jpg`, `${IMG}/v1789056733/${P}/ofhrqaqby2axxd9ezyyz.jpg`],
    description:
      'Scarlet red softening into a warm peach pallu, with a gold zari border of running paisleys along both edges. The gentler half of the drape keeps it wearable in daylight — a festive saree that does not wait for evening.',
  },
  {
    name: 'Maroon & Antique Gold Mysore Silk',
    category: 'Bridal',
    colour: 'Maroon & Antique Gold',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Full gold tissue pallu',
    occasion: 'Wedding / Reception',
    media: [`${IMG}/v1789056698/${P}/ftldmszant6yqbz9rchc.jpg`],
    description:
      'Deep maroon opening into a pallu woven almost entirely in antique gold, ruled with zari lines and closed by a temple-motif band. The gold half does all the talking, which is why this one belongs at a reception.',
  },
  {
    name: 'Marigold & Coffee Brown Mysore Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Marigold Yellow & Coffee Brown',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Floral zari border',
    occasion: 'Festive / Pooja',
    media: [`${IMG}/v1789056700/${P}/zwsdrwibwart6dr0gn9x.jpg`, `${IMG}/v1789056706/${P}/fmnpvgxfbhthwe2mnxsk.jpg`],
    description:
      'Bright marigold against a deep coffee-brown pallu striped in fine zari, with a floral gold border running the length of it. Warm, grounded colour — the sort of saree that suits a morning ceremony and an evening one equally.',
  },
  {
    name: 'Magenta & Ivory Gold Zari Silk',
    category: 'Bridal',
    colour: 'Magenta & Ivory',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Wide gold zari border',
    occasion: 'Wedding / Muhurtham',
    media: [`${IMG}/v1789056702/${P}/u2tboyt6jjz5eukp2m3n.jpg`, `${IMG}/v1789056724/${P}/vdxam3j0lymdhgkhuqwd.jpg`],
    description:
      'Bright magenta against a cream-ivory pallu banded in wide gold zari — the classic muhurtham pairing, done cleanly. The ivory carries the gold beautifully, so the border reads from across the hall.',
  },
  {
    name: 'Sunset Orange & Coffee Stripe Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Orange & Coffee Brown',
    fabric: 'Pure Mysore Silk',
    pattern: 'Striped',
    workType: 'Fine gold zari stripes',
    occasion: 'Festive / Temple',
    media: [`${IMG}/v1789056704/${P}/ccffqsi3mgtn0vg0xnna.jpg`, `${IMG}/v1789056726/${P}/hxtahlfxkvxpbtb2hksa.jpg`],
    description:
      'A glowing sunset-orange body that turns into a deep coffee-brown pallu, ruled through with fine gold zari stripes and closed by a narrow beaded border. Light on the shoulder, rich in the photograph — the everyday festive silk you end up reaching for most.',
  },
  {
    name: 'Wine & Dusty Rose Mysore Silk',
    category: 'Designer',
    colour: 'Wine & Dusty Rose',
    fabric: 'Pure Mysore Silk',
    pattern: 'Striped',
    workType: 'Slim gold zari border',
    occasion: 'Office / Day Wear',
    media: [`${IMG}/v1789056707/${P}/jbospguilcr1mvhp6z14.jpg`],
    description:
      'Deep wine falling into a muted dusty-rose pallu, with only a slim gold zari line to finish it. The most understated saree here — the one for the day you want the silk noticed and not the shine.',
  },
  {
    name: 'Scarlet & Black Zari Check Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Scarlet Red & Black',
    fabric: 'Pure Mysore Silk',
    pattern: 'Checked',
    workType: 'Gold zari checks and floral border',
    occasion: 'Festive / Evening',
    media: [`${IMG}/v1789056709/${P}/ztnwrifca8lpgwqhdfuj.jpg`, `${IMG}/v1789056720/${P}/rzyscicxsvklrfbwlpjd.jpg`],
    description:
      'Scarlet red against a black pallu gridded in gold zari checks and finished with a wide floral border. Red and black is the sharpest contrast in the collection, and the gold sits on the black like it was made for it.',
  },
  {
    name: 'Sunset Orange & Maroon Zari Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Orange & Deep Maroon',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Broad floral zari border',
    occasion: 'Wedding / Festive',
    media: [`${IMG}/v1789056710/${P}/bbs9wd7cpebz0feumwqp.jpg`],
    description:
      'Sunset orange running into a deep maroon pallu, framed by a broad gold zari border of full-bloom florals and crossed with gold checks. The heaviest-looking saree in this lot and the one that reads best under function lighting.',
  },
  {
    name: 'Crimson & Bottle Green Zari Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Crimson Red & Bottle Green',
    fabric: 'Pure Mysore Silk',
    pattern: 'Striped',
    workType: 'Gold zari stripes and floral border',
    occasion: 'Wedding / Festive',
    media: [`${IMG}/v1789056712/${P}/bzpde9uswlj2sgga05yr.jpg`],
    description:
      'Crimson meeting a deep bottle-green pallu striped through with gold zari and closed by a woven floral band. Red and green is the oldest pairing in the South Indian book, and it still looks the part.',
  },
  {
    name: 'Royal Blue Mysore Silk',
    category: 'Designer',
    colour: 'Royal Blue',
    fabric: 'Pure Mysore Silk',
    pattern: 'Solid',
    workType: 'Gold zari border',
    occasion: 'Reception / Party',
    media: [`${IMG}/v1789056714/${P}/mg3nwlaf1umywgioqakb.jpg`, `${IMG}/v1789056717/${P}/g2w5fouh4dhs6lawdklc.jpg`],
    description:
      'Unbroken royal blue with the quiet confidence a single colour gives you, edged in a slim gold zari border and finished with a woven floral band at the pallu. Nothing competes with the drape — which is exactly the point.',
  },
  {
    name: 'Rani Pink & Dusty Mauve Silk',
    category: 'Bridal',
    colour: 'Rani Pink & Dusty Mauve',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Ornate gold floral zari',
    occasion: 'Wedding / Reception',
    media: [`${IMG}/v1789056715/${P}/xsa0yxgnccelk8ynzvyv.jpg`, `${IMG}/v1789056722/${P}/woykb3kbcl06qjymehlw.jpg`],
    description:
      'Rani pink meets a soft dusty mauve across the drape, held together by an ornate gold zari border of blooming florals. The warm neutral pallu keeps all that pink from shouting, which makes it a rare thing: a bridal saree you can wear again.',
  },
  {
    name: 'Olive Gold & Purple Zari Silk',
    category: 'Designer',
    colour: 'Olive Gold & Purple',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Gold zari stripes and temple border',
    occasion: 'Festive / Party',
    media: [`${IMG}/v1789056719/${P}/t4qimyqang9mzdmqtjhh.jpg`],
    description:
      'An unusual olive-gold body against a deep purple pallu striped in zari and closed with a temple-motif border. The two colours should not work together and completely do — easily the most distinctive drape in this batch.',
  },
  {
    name: 'Rani Pink & Peacock Blue Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Rani Pink & Peacock Blue',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Broad floral zari border',
    occasion: 'Wedding / Festive',
    media: [
      `${IMG}/v1789056728/${P}/ejexly35vxdx8dnqlbbp.jpg`,
      `${IMG}/v1789056737/${P}/ixjpddmsrv3xj2wutaa3.jpg`,
      `${IMG}/v1789056739/${P}/htwhh6sstzwvc28ypvaa.jpg`,
    ],
    description:
      'Peacock blue against a rani pink pallu carrying a broad gold zari border of woven florals. Two saturated jewel tones set directly against each other, with enough gold between them to keep the peace.',
  },
  {
    name: 'Coral Rose Mysore Silk',
    category: 'Designer',
    colour: 'Coral Rose',
    fabric: 'Pure Mysore Silk',
    pattern: 'Solid',
    workType: 'Paisley zari border',
    occasion: 'Day Function / Office',
    media: [`${IMG}/v1789056730/${P}/hvysn0ksufuydazcbhi9.jpg`],
    description:
      'A single wash of coral rose from end to end, with a fine gold paisley border and a few zari lines at the pallu. Soft, warm and completely uncomplicated — the easiest saree here to actually get dressed in.',
  },
  {
    name: 'Bottle Green & Rani Pink Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Bottle Green & Rani Pink',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Gold zari floral border',
    occasion: 'Wedding / Festive',
    media: [`${IMG}/v1789056731/${P}/a3tnz1hf7rqpxsugddjb.jpg`],
    description:
      'The pairing every South Indian wardrobe eventually wants: deep bottle green with a rani pink pallu and gold zari florals down the border. Traditional to its core, and it photographs like an heirloom because it more or less is one.',
  },
  {
    name: 'Turmeric Yellow & Maroon Silk',
    category: 'Kanjeevaram Silk',
    colour: 'Turmeric Yellow & Maroon',
    fabric: 'Pure Mysore Silk',
    pattern: 'Zari Woven',
    workType: 'Broad floral zari border',
    occasion: 'Pooja / Haldi',
    media: [`${IMG}/v1789056735/${P}/ntvjgm9mctdyxfgxjaev.jpg`],
    description:
      'Warm turmeric yellow closing into a deep maroon pallu with a broad gold zari border of woven florals. An auspicious colour pairing that belongs at pooja and haldi mornings, and holds its own at the reception after.',
  },
];
