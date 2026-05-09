// Authoritative list of books by Russ McKendrick. Consumed by /about/ and /books/.
// Records ordered roughly by publication, oldest first.

export interface Book {
  slug: string
  name: string
  img: string
  alt: string
  href: string | null
  publisher: string
}

const PACKT = 'Packt Publishing'
const NEW_STACK = 'The New Stack'

export const books: Book[] = [
  {
    slug: 'monitoring-docker',
    name: 'Monitoring Docker',
    img: '/assets/about/images/02.jpg',
    alt: 'Monitoring Docker',
    href: 'https://www.packtpub.com/en-us/product/monitoring-docker-9781785885501',
    publisher: PACKT
  },
  {
    slug: 'monitoring-and-management-with-docker-and-containers',
    name: 'Monitoring and Management With Docker and Containers',
    img: '/assets/about/images/01.png',
    alt: 'Monitoring and Management With Docker and Containers',
    href: 'https://thenewstack.io/ebooks/docker-and-containers/monitoring-management-docker-containers/',
    publisher: NEW_STACK
  },
  {
    slug: 'extending-docker',
    name: 'Extending Docker',
    img: '/assets/about/images/03.jpg',
    alt: 'Extending Docker',
    href: 'https://www.packtpub.com/en-us/product/extending-docker-9781786462312',
    publisher: PACKT
  },
  {
    slug: 'docker-bootcamp',
    name: 'Docker Bootcamp',
    img: '/assets/about/images/04.jpg',
    alt: 'Docker Bootcamp',
    href: null,
    publisher: PACKT
  },
  {
    slug: 'mastering-docker-second-edition',
    name: 'Mastering Docker, Second Edition',
    img: '/assets/about/images/05.jpg',
    alt: 'Mastering Docker - Second Edition',
    href: null,
    publisher: PACKT
  },
  {
    slug: 'kubernetes-for-serverless-applications',
    name: 'Kubernetes for Serverless Applications',
    img: '/assets/about/images/06.jpg',
    alt: 'Kubernetes for Serverless Applications',
    href: 'https://www.packtpub.com/product/kubernetes-for-serverless-applications/9781788620376',
    publisher: PACKT
  },
  {
    slug: 'learn-ansible',
    name: 'Learn Ansible',
    img: '/assets/about/images/07.png',
    alt: 'Learn Ansible',
    href: 'https://www.packtpub.com/en-us/product/learn-ansible-9781788999328',
    publisher: PACKT
  },
  {
    slug: 'mastering-docker-third-edition',
    name: 'Mastering Docker, Third Edition',
    img: '/assets/about/images/08.jpg',
    alt: 'Mastering Docker - Third Edition',
    href: null,
    publisher: PACKT
  },
  {
    slug: 'docker-high-performance',
    name: 'Docker High Performance',
    img: '/assets/about/images/09.png',
    alt: 'Docker High Performance',
    href: 'https://www.packtpub.com/en-us/product/docker-high-performance-9781789804409',
    publisher: PACKT
  },
  {
    slug: 'mastering-docker-fourth-edition',
    name: 'Mastering Docker, Fourth Edition',
    img: '/assets/about/images/10.jpg',
    alt: 'Mastering Docker - Fourth Edition',
    href: 'https://www.packtpub.com/en-us/product/mastering-docker-fourth-edition-9781839213519',
    publisher: PACKT
  },
  {
    slug: 'the-kubernetes-bible',
    name: 'The Kubernetes Bible',
    img: '/assets/about/images/11.png',
    alt: 'The Kubernetes Bible',
    href: 'https://www.packtpub.com/en-us/product/the-kubernetes-bible-9781838829452',
    publisher: PACKT
  },
  {
    slug: 'infrastructure-as-code-for-beginners',
    name: 'Infrastructure as Code for Beginners',
    img: '/assets/about/images/12.jpg',
    alt: 'Infrastructure as Code for Beginners',
    href: 'https://www.packtpub.com/product/infrastructure-as-code-for-beginners/9781837631636',
    publisher: PACKT
  },
  {
    slug: 'learn-ansible-second-edition',
    name: 'Learn Ansible, Second Edition',
    img: '/assets/about/images/13.jpg',
    alt: 'Learn Ansible, Second Edition',
    href: 'https://www.packtpub.com/product/learn-ansible-second-edition/9781835088913',
    publisher: PACKT
  },
  {
    slug: 'the-kubernetes-bible-second-edition',
    name: 'The Kubernetes Bible, Second Edition',
    img: '/assets/about/images/14.jpg',
    alt: 'The Kubernetes Bible, Second Edition',
    href: 'https://www.packtpub.com/en-gb/product/the-kubernetes-bible-9781835468241',
    publisher: PACKT
  }
]
