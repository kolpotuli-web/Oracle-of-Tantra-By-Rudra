-- Seed the public research catalogue with lawful scholarly records.
-- These are metadata records pointing to publisher/open-access pages or PDFs;
-- the site does not copy third-party articles into the repository.

with seed(
  title,
  author,
  item_type,
  publication_date,
  description,
  url,
  rights_status,
  tags,
  featured,
  visible,
  review_status
) as (
  values
    (
      'Conserving the ‘Container’ of Tantric Secrecy: A Discussion with Western Śākta Practitioners',
      'Sophie-Anne Perkins',
      'article',
      '2021-09-06'::date,
      'An anthropological study of secrecy and practitioner perspectives in Western Śākta contexts.',
      'https://www.mdpi.com/2077-1444/12/9/729',
      'licensed',
      array['Śākta', 'secrecy', 'anthropology', 'practice'],
      false,
      true,
      'approved'
    ),
    (
      'Uddālaka’s Yoga in the Mokṣopāya',
      'Tamara Cohen',
      'pdf',
      '2020-03-04'::date,
      'A study of Uddālaka, kuṇḍalinī, OṂ recitation and the development of later yoga praxis.',
      'https://www.mdpi.com/2077-1444/11/3/111/pdf',
      'licensed',
      array['Yoga', 'Kuṇḍalinī', 'Mokṣopāya', 'history'],
      false,
      true,
      'approved'
    ),
    (
      'Kālavañcana in the Konkan: How a Vajrayāna Haṭhayoga Tradition Cheated Buddhism’s Death in India',
      'James Mallinson',
      'pdf',
      '2019-04-16'::date,
      'Research on the relationship between Buddhist and Śaiva traditions of physical yoga and the transmission of haṭhayoga in India.',
      'https://www.mdpi.com/2077-1444/10/4/273/pdf',
      'licensed',
      array['Vajrayāṇa', 'Śaivism', 'Haṭhayoga', 'India'],
      true,
      true,
      'approved'
    ),
    (
      'Amṛtasiddhi A Posteriori: An Exploratory Study on the Possible Impact of the Amṛtasiddhi on the Subsequent Sanskritic Vajrayāna Tradition',
      'Samuel Grimes',
      'article',
      '2020-03-19'::date,
      'An exploratory study of the Amṛtasiddhi and its possible influence on later Sanskritic Vajrayāna traditions.',
      'https://www.mdpi.com/2077-1444/11/3/140',
      'licensed',
      array['Vajrayāṇa', 'Amṛtasiddhi', 'Haṭhayoga', 'Sanskrit'],
      true,
      true,
      'approved'
    ),
    (
      'Kuṇḍalinī Rising and Liberation in the Yogavāsiṣṭha: The Story of Cūḍālā and Śikhidhvaja',
      'Ana Laura Funes Maderey',
      'pdf',
      '2017-11-14'::date,
      'A study of kuṇḍalinī, liberation, and the Cūḍālā–Śikhidhvaja narrative in the Yogavāsiṣṭha.',
      'https://www.mdpi.com/2077-1444/8/11/248/pdf',
      'licensed',
      array['Kuṇḍalinī', 'Yogavāsiṣṭha', 'liberation'],
      false,
      true,
      'approved'
    ),
    (
      'Where the Heroes and Sky-Goers Gather: A Study of the Sauraṭa Pilgrimage',
      'Paul B. Donnelly',
      'article',
      '2017-08-21'::date,
      'A study of pilgrimage and less-studied practices within Tibetan and Himalayan Buddhist traditions.',
      'https://www.mdpi.com/2077-1444/8/8/157',
      'licensed',
      array['Vajrayāṇa', 'pilgrimage', 'Himalaya', 'ritual'],
      false,
      true,
      'approved'
    ),
    (
      'Society for Tantric Studies Proceedings (2016) — Open Access Special Issue',
      'MDPI Religions',
      'report',
      '2016-01-01'::date,
      'A curated open-access special issue containing peer-reviewed papers on Tantra, Yoga, Buddhism, Śaivism, ritual, embodiment and related fields.',
      'https://www.mdpi.com/journal/religions/special_issues/tantric_studies_proceedings',
      'licensed',
      array['Society for Tantric Studies', 'research collection', 'Tantra', 'Yoga', 'Buddhism'],
      true,
      true,
      'approved'
    ),
    (
      'The transformation of classical Tantra in the modern Neotantric movement',
      'Sergey Pakhomov',
      'article',
      '2023-12-01'::date,
      'A scholarly study of transformations of classical Tantra in modern Western and Russian Neotantric movements.',
      'https://doaj.org/article/0465068895ae4809bbc71d83564f8943',
      'licensed',
      array['modern Tantra', 'Neotantra', 'history', 'reception'],
      false,
      true,
      'approved'
    )
)
insert into public.library_items (
  title,
  author,
  item_type,
  publication_date,
  description,
  url,
  rights_status,
  tags,
  featured,
  visible,
  review_status
)
select
  seed.title,
  seed.author,
  seed.item_type,
  seed.publication_date,
  seed.description,
  seed.url,
  seed.rights_status,
  seed.tags,
  seed.featured,
  seed.visible,
  seed.review_status
from seed
where not exists (
  select 1
  from public.library_items existing
  where lower(existing.title) = lower(seed.title)
);
