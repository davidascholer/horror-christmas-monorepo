/**
 * Characters Seed Data
 * 
 * This file contains 23 characters from Christmas horror films.
 * Required characters from Requirement 6.5: Krampus, Billy Chapman, Stripe, Gizmo, Yule Cat, Frau Perchta.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CharacterSeedData {
  slug: string;
  name: string;
  summary: string;
  biography: string;
  origin?: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  franchiseSlug?: string;
  tagSlugs: string[];
}

/**
 * 23 Christmas horror characters including all required named characters
 */
export const characters: CharacterSeedData[] = [
  {
    slug: 'krampus',
    name: 'Krampus',
    summary: 'The horned Christmas demon from Alpine folklore who punishes naughty children and those who lose the Christmas spirit.',
    biography: 'Krampus is an ancient creature from pre-Christian Alpine folklore, the dark companion to Saint Nicholas. While Santa rewards good children, Krampus punishes the wicked. Depicted as a horned, cloven-hoofed beast with a long tongue and chains, Krampus carries naughty children away in his sack or basket. In modern cinema, Michael Dougherty\'s 2015 film brought Krampus into mainstream horror, portraying him as an ancient demon who arrives when families lose their Christmas spirit. Krampus commands an army of nightmarish helpers including demonic gingerbread men, carnivorous toys, and the terrifying angel tree topper.',
    origin: 'Alpine folklore from Austria, Bavaria, and other Central European regions. Traditions date back centuries to pre-Christian winter solstice celebrations.',
    image: '/images/characters/krampus.jpg',
    seoTitle: 'Krampus - Alpine Christmas Demon Character',
    seoDescription: 'Learn about Krampus, the horned Christmas demon from Alpine folklore who punishes naughty children in horror films.',
    featured: true,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'creature-feature'],
  },
  {
    slug: 'billy-chapman',
    name: 'Billy Chapman',
    summary: 'The traumatized protagonist of Silent Night, Deadly Night who becomes a killer Santa Claus.',
    biography: 'Billy Chapman witnessed his parents\' murder by a man dressed as Santa Claus on Christmas Eve when he was just a child. Raised in a abusive Catholic orphanage where he was severely punished for any perceived naughtiness, Billy developed deep psychological trauma associating Christmas with violence and strict moral judgment. As a young adult working at a toy store, Billy\'s fragile mental state shatters when he\'s forced to dress as Santa. He snaps completely, embarking on a killing spree while dressed as Santa, punishing those he deems "naughty." Billy\'s story is a tragic examination of how childhood trauma and abuse can warp innocence into violence.',
    origin: 'Created for the 1984 film Silent Night, Deadly Night. The character became controversial for subverting the Santa Claus image.',
    image: '/images/characters/billy-chapman.jpg',
    seoTitle: 'Billy Chapman - Silent Night Deadly Night Killer Santa',
    seoDescription: 'Billy Chapman, the traumatized killer Santa from Silent Night Deadly Night, a horror icon born from childhood trauma.',
    featured: true,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'family-trauma', 'psychological'],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    summary: 'The malevolent leader of the Gremlins, transformed from a Mogwai into a chaos-wreaking monster.',
    biography: 'Stripe emerged when the adorable Mogwai named Gizmo was accidentally exposed to water, spawning several mischievous offspring. Unlike the gentle Gizmo, these Mogwai had darker personalities, with Stripe as their cruel alpha. When Stripe and his cohorts ate after midnight, they transformed into reptilian Gremlins - vicious, intelligent creatures dedicated to destruction and violence. Stripe proved the most cunning and dangerous, leading the Gremlins\' Christmas Eve rampage through Kingston Falls. With a distinctive white mohawk stripe, Stripe became the primary antagonist, showing sadistic enjoyment in terrorizing humans and causing chaos. His death in the film\'s climax - melting in sunlight after Billy opened roof shutters - remains iconic.',
    origin: 'Created by Chris Columbus for the 1984 Gremlins film directed by Joe Dante. Special effects by Chris Walas.',
    image: '/images/characters/stripe.jpg',
    seoTitle: 'Stripe - Gremlins Leader and Main Antagonist',
    seoDescription: 'Stripe, the malevolent Gremlin leader with a mohawk stripe who terrorized Kingston Falls on Christmas Eve.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'practical-effects'],
  },
  {
    slug: 'gizmo',
    name: 'Gizmo',
    summary: 'The adorable, gentle Mogwai from Gremlins who remains pure despite his offspring becoming monsters.',
    biography: 'Gizmo is a Mogwai - a rare creature from Chinese mythology brought to America as an unusual Christmas gift. Unlike the other Mogwai spawned from him, Gizmo maintains an innocent, gentle nature. He\'s small, furry, with large expressive eyes and bat-like ears. Gizmo loves watching television, particularly old movies, and has a pure heart despite his species\' dangerous potential. When exposed to water, Mogwai multiply, and if they eat after midnight, they transform into reptilian Gremlins. Gizmo never transforms, remaining the protagonist\'s loyal companion through multiple Gremlins attacks. He\'s brave despite his size, ultimately helping defeat Stripe and the other Gremlins. Gizmo represents innocence persisting through chaos.',
    origin: 'Designed by Chris Walas for Gremlins (1984). Puppeteered and voiced by Howie Mandel. Became the breakout character and franchise mascot.',
    image: '/images/characters/gizmo.jpg',
    seoTitle: 'Gizmo - Gremlins Mogwai Hero Character',
    seoDescription: 'Gizmo, the adorable Mogwai hero of Gremlins who remains innocent while his offspring become monsters.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'beginner-friendly', 'practical-effects'],
  },
  {
    slug: 'yule-cat',
    name: 'Yule Cat',
    summary: 'The Jólakötturinn - a giant, monstrous cat from Icelandic folklore that devours those who don\'t receive new clothes for Christmas.',
    biography: 'The Yule Cat (Jólakötturinn) is a massive, vicious feline from Icelandic Christmas folklore. This enormous black cat prowls the snowy countryside during the Christmas season, peering into windows to see who has received new clothes as gifts. According to legend, those who don\'t have new garments to wear on Christmas are devoured by the Yule Cat. The creature was historically used to encourage wool production - workers who finished their tasks before Christmas would receive new clothes, while lazy workers faced the Cat\'s hunger. The Yule Cat is often associated with the giantess Grýla and her mischievous sons, the Yule Lads. In modern horror interpretations, the Yule Cat represents ancient winter threats and the dark side of Christmas gift-giving traditions.',
    origin: 'Icelandic folklore, with written records dating to the 19th century. Popularized by Icelandic poet Jóhannes úr Kötlum in 1932.',
    image: '/images/characters/yule-cat.jpg',
    seoTitle: 'Yule Cat - Icelandic Christmas Monster',
    seoDescription: 'The Yule Cat (Jólakötturinn), a giant monster from Icelandic folklore that devours those without new clothes at Christmas.',
    featured: true,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'creature-feature', 'international'],
  },
  {
    slug: 'frau-perchta',
    name: 'Frau Perchta',
    summary: 'An Alpine witch who rewards the virtuous and brutally punishes the lazy during the Twelve Days of Christmas.',
    biography: 'Frau Perchta (also known as Perchta or Berchta) is a pre-Christian Alpine goddess who appears during the Twelve Days of Christmas, particularly on Twelfth Night. She has a dual nature: appearing as a beautiful woman to reward the industrious, or as a haggish crone to punish the lazy and wicked. Her most infamous punishment involves slitting open the bellies of those who haven\'t eaten the traditional foods or completed their spinning work before Christmas, replacing their organs with straw and stones. Perchta is often depicted with one large foot (goose foot or swan foot) and leads a procession of the dead, including the unbaptized children, during winter nights. In modern horror, she represents the dangerous feminine power of winter and the deadly consequences of breaking traditional winter taboos.',
    origin: 'Germanic and Alpine folklore dating to pre-Christian times. Associated with winter solstice traditions and spinning/weaving.',
    image: '/images/characters/frau-perchta.jpg',
    seoTitle: 'Frau Perchta - Alpine Christmas Witch',
    seoDescription: 'Frau Perchta, the terrifying Alpine witch who rewards and punishes during the Twelve Days of Christmas.',
    featured: true,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international', 'extreme'],
  },
  {
    slug: 'santa-claus-krampus-2015',
    name: 'Santa Claus (Krampus)',
    summary: 'The corrupted, nightmarish version of Santa Claus who appears in Krampus, more demon than jolly gift-giver.',
    biography: 'In Krampus (2015), Santa Claus is reimagined not as a separate entity but as part of Krampus\'s domain. The film presents Christmas iconography corrupted into nightmare form - what should be Santa\'s helpers become Krampus\'s demonic servants. This version suggests that losing true Christmas spirit summons not Santa but his dark opposite. The Christmas decorations, gingerbread men, and toys that should bring joy instead become instruments of terror. This Santa represents the death of Christmas belief and the punishment for cynicism and family discord.',
    origin: 'Reimagined for Michael Dougherty\'s Krampus (2015) as part of the film\'s subversion of Christmas mythology.',
    image: '/images/characters/santa-krampus.jpg',
    seoTitle: 'Santa Claus from Krampus - Corrupted Christmas Icon',
    seoDescription: 'The nightmarish Santa from Krampus (2015), representing corrupted Christmas spirit and demonic punishment.',
    featured: false,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'dark-comedy'],
  },
  {
    slug: 'ricky-caldwell',
    name: 'Ricky Caldwell',
    summary: 'Billy Chapman\'s younger brother who follows his sibling\'s path into killer Santa madness.',
    biography: 'Ricky Caldwell witnessed his brother Billy\'s Santa-suited killing spree as a child, cementing his own trauma. Institutionalized after Billy\'s death, Ricky grew up surrounded by psychologists trying to understand his family\'s Christmas curse. Despite efforts at treatment, Ricky inherited his brother\'s association of Christmas with violence. As an adult, Ricky escaped custody and embarked on his own killing spree. He\'s most famous for his "Garbage Day!" outburst - a scene that became an internet meme. Unlike Billy\'s tragic descent, Ricky seems to embrace the madness, showing dark humor and self-awareness about his role as killer Santa.',
    origin: 'Created for Silent Night, Deadly Night Part 2 (1987). Portrayed by Eric Freeman in an iconic, meme-worthy performance.',
    image: '/images/characters/ricky-caldwell.jpg',
    seoTitle: 'Ricky Caldwell - Silent Night Deadly Night Part 2',
    seoDescription: 'Ricky Caldwell, Billy\'s brother and the "Garbage Day!" killer Santa from Silent Night Deadly Night Part 2.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'family-trauma', 'campy'],
  },
  {
    slug: 'jack-frost-character',
    name: 'Jack Frost (Serial Killer Snowman)',
    summary: 'A serial killer mutated into a murderous snowman with a taste for creative kills.',
    biography: 'Jack Frost was a vicious serial killer being transported to execution when a freak accident involving genetic material transformed him into a living snowman. As Jack Frost the snowman, he retains his human consciousness and sadistic personality but gains new abilities: he can melt and reform, travel through plumbing, freeze his victims, and manipulate his snow body in creative ways. His kills are theatrical and inventive, taking advantage of his snowman form. Jack has a personal vendetta against the sheriff who captured him. Despite his absurd form, Jack is genuinely dangerous, combining human intelligence with supernatural snowman powers. His wise-cracking personality makes him both terrifying and darkly comedic.',
    origin: 'Created for Jack Frost (1997). Brought to life through practical effects and puppetry with voice work by Scott MacDonald.',
    image: '/images/characters/jack-frost.jpg',
    seoTitle: 'Jack Frost - The Killer Snowman Character',
    seoDescription: 'Jack Frost, the serial killer transformed into a murderous snowman in the cult horror comedy.',
    featured: false,
    franchiseSlug: 'jack-frost',
    tagSlugs: ['creature-feature', 'dark-comedy', 'campy'],
  },
  {
    slug: 'real-santa-rare-exports',
    name: 'Santa Claus (Rare Exports)',
    summary: 'The terrifying true Santa Claus from Finnish folklore - an ancient evil buried in ice.',
    biography: 'In Rare Exports, Santa Claus is reimagined as an ancient, demonic entity from pre-Christian Finnish folklore. This Santa was buried deep within the Korvatunturi mountain centuries ago because he was too dangerous. When archaeologists unearth him, they discover the real Santa is a horned, vicious creature who punishes rather than rewards. He commands an army of feral, elderly men who serve as his helpers - naked, bearded savages who kidnap naughty children. This Santa represents the dark winter spirits of ancient paganism, predating the jolly gift-giver myth. The film suggests our modern Santa is a sanitized version created to hide the terrifying truth of what once haunted winter nights.',
    origin: 'Reimagined for the Finnish film Rare Exports: A Christmas Tale (2010), drawing from Nordic folklore and Yule traditions.',
    image: '/images/characters/santa-rare-exports.jpg',
    seoTitle: 'Santa Claus from Rare Exports - Ancient Finnish Horror',
    seoDescription: 'The terrifying ancient Santa from Rare Exports, a pre-Christian demon from Finnish folklore.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'creature-feature', 'international'],
  },
  {
    slug: 'billy-lenz',
    name: 'Billy (Black Christmas)',
    summary: 'The mysterious, obscene phone caller and killer stalking sorority sisters in the original Black Christmas.',
    biography: 'Billy is the unseen antagonist of Black Christmas (1974), one of horror\'s most effective mysterious killers. He makes disturbing, sexually explicit phone calls to a sorority house while secretly living in the attic, watching and waiting. The killer is never fully shown or explained in the original film, adding to his effectiveness. His voice - portrayed as multiple personalities by director Bob Clark - ranges from childlike to demonic, suggesting deep psychological damage. The killer\'s identity and motivation remain ambiguous, making him more frightening. Later remakes provided backstory, but the original Billy works best as pure menace - a violation of safe domestic space during the season of peace and goodwill.',
    origin: 'Created for Black Christmas (1974) by director Bob Clark. Influenced by real-life cases and urban legends.',
    image: '/images/characters/billy-lenz.jpg',
    seoTitle: 'Billy - Black Christmas Original Killer',
    seoDescription: 'The mysterious Billy from Black Christmas (1974), the unseen killer who terrorized sorority sisters.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['slasher', 'psychological', 'atmospheric'],
  },
  {
    slug: 'violent-night-santa',
    name: 'Santa Claus (Violent Night)',
    summary: 'A battle-hardened warrior Santa who must fight to save a family from home invaders.',
    biography: 'In Violent Night, Santa Claus (portrayed by David Harbour) is reimagined as a jaded, alcoholic immortal who was once a fierce Viking warrior. After centuries of delivering presents, this Santa has grown weary and cynical about humanity. When he encounters a wealthy family under siege by mercenaries on Christmas Eve, he rediscovers his warrior past and his purpose. This Santa fights with brutal efficiency, using both Christmas-themed improvisation (candy canes as weapons, ornaments as throwing stars) and genuine combat skills. The film balances his violent capabilities with genuine warmth for true believers, particularly children. He represents both the jolly gift-giver and the fierce defender - Santa as protector father figure.',
    origin: 'Created for Violent Night (2022), blending action hero tropes with Santa mythology. Portrayed by David Harbour.',
    image: '/images/characters/violent-night-santa.jpg',
    seoTitle: 'Santa Claus from Violent Night - Warrior Santa',
    seoDescription: 'The battle-hardened warrior Santa from Violent Night who fights home invaders on Christmas Eve.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['dark-comedy', 'beginner-friendly'],
  },
  {
    slug: 'ash-luke-ashley',
    name: 'Luke',
    summary: 'The deceptively innocent teenager from Better Watch Out whose true nature is revealed through shocking twists.',
    biography: 'Luke appears to be a typical 12-year-old boy with a crush on his babysitter. When their suburban home is threatened by what seems to be a home invasion on Christmas Eve, Luke positions himself as the protective hero. However, the film subverts expectations dramatically - Luke orchestrated the entire scenario to manipulate his babysitter into reciprocating his feelings. He proves frighteningly intelligent and ruthless, willing to harm and kill to achieve his goals. Luke represents violated innocence reversed - the child is the monster, not the victim. His baby face and youth make his actions more disturbing as he demonstrates sociopathic manipulation and violence.',
    origin: 'Created for the Australian film Better Watch Out (2016). Portrayed by Levi Miller in a breakthrough disturbing performance.',
    image: '/images/characters/luke-better-watch.jpg',
    seoTitle: 'Luke from Better Watch Out - Twisted Teen Character',
    seoDescription: 'Luke, the deceptively innocent teenager from Better Watch Out whose Christmas Eve turns violently twisted.',
    featured: false,
    franchiseSlug: 'better-watch-out-universe',
    tagSlugs: ['psychological', 'subversive'],
  },
  {
    slug: 'troll',
    name: 'Krampus\'s Helper - Der Klaubauf',
    summary: 'One of Krampus\'s nightmarish servants who assists in punishing those who lose the Christmas spirit.',
    biography: 'Der Klaubauf is a traditional companion to Krampus in Alpine folklore, serving as one of several demonic helpers who accompany the Christmas devil. In Krampus (2015), these helpers take various forms including the terrifying angel topper, demonic gingerbread men, and carnivorous toys. They represent the corruption of Christmas joy - familiar holiday imagery transformed into instruments of punishment. Each helper has its own method of terror, from the Teufel Engel (Dark Angel) tree topper that drags victims into the Christmas tree to the Klaubauf teddy bear that swallows children whole. These creatures embody childhood fears made manifest.',
    origin: 'Based on Germanic folklore traditions, visualized for Krampus (2015) by Weta Workshop with practical creature effects.',
    image: '/images/characters/krampus-helper.jpg',
    seoTitle: 'Krampus Helpers - Christmas Demon Servants',
    seoDescription: 'The nightmarish helpers of Krampus who punish those without Christmas spirit through corrupted holiday imagery.',
    featured: false,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'creature-feature', 'practical-effects'],
  },
  {
    slug: 'harry-stadling',
    name: 'Harry Stadling',
    summary: 'The disturbed toy factory worker from Christmas Evil who believes he is Santa Claus.',
    biography: 'Harry Stadling\'s childhood was destroyed when he discovered Santa Claus wasn\'t real - or more precisely, when he saw his mother kissing "Santa" (actually his father). This trauma warped Harry\'s psyche, leading to an obsessive fixation on Christmas and Santa Claus. As an adult working at a toy factory, Harry keeps detailed lists of neighborhood children\'s behavior, decorates his van like a sleigh, and genuinely believes he\'s becoming Santa. Unlike simple killer Santa films, Christmas Evil is a character study of delusion and mental illness. Harry wants to reward the good and punish the naughty, but his fractured mind can\'t distinguish fantasy from reality. His descent is tragic and disturbing, making him one of horror\'s most psychologically complex killers.',
    origin: 'Created for Christmas Evil (1980), also known as You Better Watch Out. Portrayed by Brandon Maggart in a disturbing performance.',
    image: '/images/characters/harry-stadling.jpg',
    seoTitle: 'Harry Stadling - Christmas Evil Delusional Santa',
    seoDescription: 'Harry Stadling from Christmas Evil, the disturbed man who believes he\'s Santa Claus in this psychological horror.',
    featured: false,
    franchiseSlug: 'christmas-evil-universe',
    tagSlugs: ['killer-santa', 'psychological', 'family-trauma'],
  },
  {
    slug: 'fiona-black-christmas',
    name: 'The Black Christmas Cult',
    summary: 'The mysterious cult of killers from the 2019 Black Christmas remake who target women.',
    biography: 'In the 2019 reimagining of Black Christmas, the threat comes from a secret fraternity cult that uses a bust of the university\'s misogynistic founder to possess male students. These possessed men coordinate attacks against women on campus during winter break, particularly targeting feminist activists. The cult represents institutional misogyny and toxic masculinity made supernatural. The black goo that drips from the founder\'s bust symbolizes how historical institutional sexism infects new generations. While controversial among fans of the original, this version transforms Billy from an individual psychotic into a systemic threat, making a pointed statement about campus culture and violence against women.',
    origin: 'Created for the 2019 Black Christmas remake directed by Sophia Takal, reframing the franchise with feminist themes.',
    image: '/images/characters/black-christmas-cult.jpg',
    seoTitle: 'Black Christmas Cult - 2019 Remake Antagonists',
    seoDescription: 'The cult of possessed students from Black Christmas (2019) who embody toxic institutional misogyny.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['slasher', 'supernatural', 'subversive'],
  },
  {
    slug: 'the-children-from-the-children',
    name: 'The Children (The Children)',
    summary: 'Infected children who turn violently murderous in the British horror film The Children.',
    biography: 'In The Children (2008), a mysterious illness affects the children at a holiday gathering in the English countryside. The infection transforms innocent children into blank-faced killers who methodically murder the adults around them. What makes these children terrifying is their ordinary appearance - they still look like children, making it nearly impossible for parents to defend themselves. They use household objects and exploit adult reluctance to harm them. The film never fully explains the infection, leaving ambiguity about whether it\'s supernatural, viral, or environmental. These children represent every parent\'s nightmare: their beloved offspring turned into something unknowable and dangerous.',
    origin: 'Created for the British film The Children (2008), directed by Tom Shankland. Part of the killer children subgenre.',
    image: '/images/characters/the-children.jpg',
    seoTitle: 'The Children - Infected Killer Children',
    seoDescription: 'The mysteriously infected children from The Children (2008) who turn murderous during a Christmas holiday.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['family-trauma', 'atmospheric', 'international'],
  },
  {
    slug: 'gryla',
    name: 'Grýla',
    summary: 'The giantess from Icelandic folklore who kidnaps and eats misbehaving children at Christmas.',
    biography: 'Grýla is an ancient giantess from Icelandic mythology who lives in the mountains and emerges at Christmas to hunt for naughty children. She has thirteen tails, hooves, and multiple heads in some descriptions. Grýla kidnaps bad children in her giant sack, taking them back to her cave where she boils them in her cauldron to make stew. She\'s married to the lazy Leppalúði and is the mother of the Yule Lads - thirteen mischievous troll sons who visit Iceland one per night in the thirteen days before Christmas. The Yule Cat is her pet. Grýla represents the terrifying consequences of bad behavior, a figure used for centuries to frighten Icelandic children into obedience during the dark winter months.',
    origin: 'Ancient Icelandic folklore, with written records from the 13th century. Central figure in Icelandic Christmas traditions.',
    image: '/images/characters/gryla.jpg',
    seoTitle: 'Grýla - Icelandic Christmas Giantess',
    seoDescription: 'Grýla, the child-eating giantess from Icelandic folklore who hunts naughty children at Christmas.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'creature-feature', 'international'],
  },
  {
    slug: 'the-yule-lads',
    name: 'The Yule Lads',
    summary: 'Thirteen mischievous troll brothers from Icelandic folklore who visit during the thirteen nights before Christmas.',
    biography: 'The Yule Lads (Jólasveinar) are the thirteen sons of the giantess Grýla and Leppalúði. Each has a distinct personality and particular mischief he causes. They visit Icelandic children one per night in the thirteen nights leading up to Christmas, leaving gifts for good children or rotten potatoes for bad ones. Their names describe their tricks: Sheep-Cote Clod harasses sheep, Gully Gawk hides in gullies to steal milk, Stubby steals pans to eat crust, Spoon Licker licks spoons, Pot Scraper steals leftovers, Bowl Licker licks bowls, Door Slammer slams doors, Skyr Gobbler eats skyr, Sausage Swiper steals sausages, Window Peeper peeks through windows, Door Sniffer has a huge nose, Meat Hook steals meat, and Candle Stealer steals candles. While more mischievous than evil today, older tales depicted them as more sinister.',
    origin: 'Icelandic folklore with oral traditions dating back centuries. Their modern characterization was standardized in the 20th century.',
    image: '/images/characters/yule-lads.jpg',
    seoTitle: 'The Yule Lads - Icelandic Christmas Trolls',
    seoDescription: 'The thirteen Yule Lads from Icelandic folklore, troll brothers who visit during the nights before Christmas.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'dark-comedy', 'international'],
  },
  {
    slug: 'le-pere-fouettard',
    name: 'Le Père Fouettard',
    summary: 'The French Christmas bogeyman who accompanies Saint Nicholas to punish bad children.',
    biography: 'Le Père Fouettard (The Whipping Father) is the dark companion to Saint Nicholas in French Christmas traditions. Dressed in dark robes with a sinister appearance, he carries a whip or bundle of switches to beat naughty children. Unlike Saint Nicholas who brings gifts to good children, Père Fouettard dispenses punishment to the bad. According to legend, he was a butcher who murdered three boys, and Saint Nicholas resurrected the children and forced the butcher to serve as his enforcer for eternity. In some versions, he carries chains and brings coal instead of treats. Père Fouettard represents the threatening aspect of Christmas - the punishment that awaits those who misbehave, a warning figure in French Christmas lore.',
    origin: 'French folklore tradition dating to the Middle Ages. Similar to Krampus and other European Christmas punishment figures.',
    image: '/images/characters/pere-fouettard.jpg',
    seoTitle: 'Le Père Fouettard - French Christmas Punisher',
    seoDescription: 'Le Père Fouettard, the whipping father who accompanies Saint Nicholas to punish naughty French children.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
  },
  {
    slug: 'zwarte-piet',
    name: 'Zwarte Piet (Controversial)',
    summary: 'The controversial helper of Sinterklaas in Dutch tradition, subject of ongoing cultural debate.',
    biography: 'Zwarte Piet (Black Pete) is the helper of Sinterklaas in Dutch Christmas tradition. Traditionally depicted with blackface makeup, Zwarte Piet has become extremely controversial due to racist connotations. The character supposedly helps Sinterklaas deliver gifts, climbing roofs and going down chimneys (which supposedly explains the black face in modern sanitized versions). In darker folklore interpretations, Zwarte Piet carries a rod or bag to punish or kidnap naughty children, taking them to Spain. The character is undergoing significant cultural reevaluation and transformation in the Netherlands due to its problematic racist imagery. In horror contexts, Zwarte Piet appears in Dutch Christmas horror films as a more sinister figure, separate from the cultural debate.',
    origin: 'Dutch tradition formalized in the 19th century, currently undergoing cultural reevaluation due to blackface controversy.',
    image: '/images/characters/zwarte-piet.jpg',
    seoTitle: 'Zwarte Piet - Controversial Dutch Christmas Figure',
    seoDescription: 'Zwarte Piet, the controversial Sinterklaas helper from Dutch tradition, a figure of ongoing cultural debate.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
  },
  {
    slug: 'belsnickel',
    name: 'Belsnickel',
    summary: 'The ragged, fur-clad Christmas figure from German folklore who tests children before rewarding them.',
    biography: 'Belsnickel is a crotchety, fur-clad Christmas gift-bringer from southwestern German folklore who later became part of Pennsylvania Dutch tradition. He arrives before Christmas wearing tattered furs or old clothing, often with a mask and carrying a switch. Unlike the jolly Santa, Belsnickel is grumpy and intimidating. He tests children by throwing candy or nuts on the floor - if they grab for treats too quickly, he swats them with his switch. Only patient, well-behaved children receive rewards. Belsnickel represents the older, more ambiguous European Christmas traditions where gift-bringers were figures of both reward and punishment, authority figures to be feared as much as loved. He embodies the "testing" aspect of Christmas - proving your worthiness through behavior.',
    origin: 'German folklore, particularly from the Palatinate region. Brought to Pennsylvania by German immigrants.',
    image: '/images/characters/belsnickel.jpg',
    seoTitle: 'Belsnickel - German Christmas Tester',
    seoDescription: 'Belsnickel, the fur-clad Christmas figure from German folklore who tests children before giving rewards.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
  },
  {
    slug: 'la-befana',
    name: 'La Befana',
    summary: 'The Italian Christmas witch who delivers gifts to children on Epiphany Eve.',
    biography: 'La Befana is an old woman or witch from Italian folklore who delivers gifts to children on Epiphany Eve (January 5th). According to legend, the Three Wise Men invited her to join them in following the star to Bethlehem, but she declined because she was too busy with housework. She later regretted her decision and set out to find the Christ child, but never succeeded. Now she flies on her broomstick every Epiphany Eve, leaving gifts for children in hopes one might be the baby Jesus. Good children receive candy and toys; naughty ones get coal or dark candy. While generally benevolent, La Befana is also depicted as somewhat frightening - an old crone entering homes through chimneys at night. She represents both motherly generosity and the eerie aspects of folklore gift-bringers.',
    origin: 'Italian folklore tradition connected to Epiphany. Legend combines Christian narrative with pre-Christian winter witch figures.',
    image: '/images/characters/la-befana.jpg',
    seoTitle: 'La Befana - Italian Christmas Witch',
    seoDescription: 'La Befana, the Italian Christmas witch who delivers gifts on Epiphany Eve while searching for the Christ child.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
  },
];

/**
 * Seed characters into the database
 */
async function seedCharacters() {
  console.log('🎭 Starting character seed...\n');

  // Get franchise IDs
  const franchises = await prisma.franchise.findMany();
  const franchiseMap = new Map(franchises.map(f => [f.slug, f.id]));

  // Get tag IDs
  const tags = await prisma.tag.findMany();
  const tagMap = new Map(tags.map(t => [t.slug, t.id]));

  const createdCharacters = new Map<string, string>();

  for (const character of characters) {
    // Get franchise ID if specified
    const franchiseId = character.franchiseSlug 
      ? franchiseMap.get(character.franchiseSlug)
      : undefined;

    if (character.franchiseSlug && !franchiseId) {
      console.warn(`⚠ Warning: Franchise not found: ${character.franchiseSlug}`);
    }

    const created = await prisma.character.upsert({
      where: { slug: character.slug },
      update: {
        name: character.name,
        summary: character.summary,
        biography: character.biography,
        origin: character.origin,
        image: character.image,
        seoTitle: character.seoTitle,
        seoDescription: character.seoDescription,
        featured: character.featured,
        franchiseId: franchiseId,
      },
      create: {
        slug: character.slug,
        name: character.name,
        summary: character.summary,
        biography: character.biography,
        origin: character.origin,
        image: character.image,
        seoTitle: character.seoTitle,
        seoDescription: character.seoDescription,
        featured: character.featured,
        franchiseId: franchiseId,
        status: 'DRAFT', // Will be published after relationships are set up
      },
    });

    createdCharacters.set(character.slug, created.id);

    // Delete existing tag relationships and recreate
    await prisma.characterTag.deleteMany({
      where: { characterId: created.id },
    });

    // Create tag relationships
    for (const tagSlug of character.tagSlugs) {
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        await prisma.characterTag.create({
          data: {
            characterId: created.id,
            tagId: tagId,
          },
        });
      }
    }

    console.log(`✓ Upserted: ${character.name}`);
  }

  console.log(`\n✅ Character seed complete! Created ${createdCharacters.size} characters.\n`);

  // Statistics
  const featuredCount = characters.filter(c => c.featured).length;
  const franchiseBreakdown = new Map<string, number>();
  
  for (const character of characters) {
    if (character.franchiseSlug) {
      franchiseBreakdown.set(
        character.franchiseSlug,
        (franchiseBreakdown.get(character.franchiseSlug) || 0) + 1
      );
    }
  }

  console.log('📊 Statistics:');
  console.log(`   Featured Characters: ${featuredCount}`);
  console.log(`   Total Characters: ${characters.length}`);
  
  console.log('\n   Franchise Distribution:');
  for (const [franchise, count] of franchiseBreakdown.entries()) {
    console.log(`     ${franchise}: ${count}`);
  }
  console.log(`     No franchise: ${characters.filter(c => !c.franchiseSlug).length}\n`);

  // Verify required characters
  const requiredCharacters = ['krampus', 'billy-chapman', 'stripe', 'gizmo', 'yule-cat', 'frau-perchta'];
  console.log('✓ Required Characters Present:');
  for (const slug of requiredCharacters) {
    const found = createdCharacters.has(slug);
    console.log(`   ${slug}: ${found ? '✓' : '✗'}`);
  }
  console.log();

  return createdCharacters;
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedCharacters();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only self-execute when run directly (e.g. `tsx prisma/seed-x.ts`), never on
// import, so prisma/seed.ts can run the steps in order.
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedCharacters, main };
