// Netlify Function для демо API
// Файл: functions/api-demo.js

exports.handler = async (event, context) => {
  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api-demo', '');
    const method = event.httpMethod;

    console.log(`${method} ${path}`);

    // Демо endpoints
    switch (path) {
      case '/books':
        return handleBooks(method, event, headers);

      case '/clubs':
        return handleClubs(method, event, headers);

      case '/auth/login':
        return handleLogin(event, headers);

      case '/auth/register':
        return handleRegister(event, headers);

      case '/user/profile':
        return handleProfile(event, headers);

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Обработчики endpoints
async function handleBooks(method, event, headers) {
  if (method === 'GET') {
    // Демо данные книг
    const books = [
      {
        id: 1,
        title: "Война и мир",
        author: "Лев Толстой",
        genre: "Классическая литература",
        year: 1869,
        pages: 1408,
        rating: 4.8,
        ratingsCount: 1247,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
        description: "Эпический роман о русском обществе в эпоху наполеоновских войн",
        isbn: "978-5-389-01234-5",
        language: "ru",
        publisher: "АСТ",
        tags: ["классика", "война", "любовь", "история"]
      },
      {
        id: 2,
        title: "1984",
        author: "Джордж Оруэлл",
        genre: "Антиутопия",
        year: 1949,
        pages: 328,
        rating: 4.7,
        ratingsCount: 2156,
        cover: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=450&fit=crop",
        description: "Мрачная антиутопия о тоталитарном обществе будущего",
        isbn: "978-5-17-123456-7",
        language: "ru",
        publisher: "Эксмо",
        tags: ["антиутопия", "фантастика", "политика", "контроль"]
      },
      {
        id: 3,
        title: "Мастер и Маргарита",
        author: "Михаил Булгаков",
        genre: "Магический реализм",
        year: 1967,
        pages: 480,
        rating: 4.9,
        ratingsCount: 3421,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
        description: "Роман о добре и зле, любви и предательстве в советской Москве",
        isbn: "978-5-699-12345-8",
        language: "ru",
        publisher: "Эксмо",
        tags: ["мистика", "философия", "любовь", "сатира"]
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: books,
        total: books.length,
        message: 'Книги загружены успешно'
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

async function handleClubs(method, event, headers) {
  if (method === 'GET') {
    const clubs = [
      {
        id: 1,
        name: "Классика навсегда",
        description: "Читаем и обсуждаем произведения классической литературы",
        members: 156,
        maxMembers: 500,
        currentBook: "Война и мир",
        currentBookId: 1,
        owner: "Анна Петрова",
        created: "2024-01-15",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        tags: ["классика", "обсуждения", "история"],
        meetingDay: "Воскресенье",
        meetingTime: "19:00",
        isPrivate: false,
        language: "ru"
      },
      {
        id: 2,
        name: "Фантастические миры",
        description: "Погружаемся в миры научной фантастики и фэнтези",
        members: 234,
        maxMembers: 300,
        currentBook: "Дюна",
        currentBookId: 4,
        owner: "Дмитрий Иванов",
        created: "2024-02-20",
        avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop",
        tags: ["фантастика", "фэнтези", "будущее"],
        meetingDay: "Суббота",
        meetingTime: "20:00",
        isPrivate: false,
        language: "ru"
      },
      {
        id: 3,
        name: "Современная проза",
        description: "Обсуждаем актуальную литературу XXI века",
        members: 89,
        maxMembers: 200,
        currentBook: "Не время умирать",
        currentBookId: 5,
        owner: "Елена Сидорова",
        created: "2024-03-10",
        avatar: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop",
        tags: ["современность", "проза", "новинки"],
        meetingDay: "Пятница",
        meetingTime: "18:30",
        isPrivate: false,
        language: "ru"
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: clubs,
        total: clubs.length,
        message: 'Клубы загружены успешно'
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

async function handleLogin(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Демо авторизация - принимаем любые данные
    if (email && password) {
      const user = {
        id: Date.now(),
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=6366f1&color=fff`,
        role: 'user',
        joinedAt: new Date().toISOString(),
        stats: {
          booksRead: Math.floor(Math.random() * 50),
          clubsJoined: Math.floor(Math.random() * 5),
          reviewsWritten: Math.floor(Math.random() * 20),
          points: Math.floor(Math.random() * 1000)
        }
      };

      // Генерируем демо JWT токен (в реальном проекте используйте настоящую библиотеку)
      const token = Buffer.from(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 })).toString('base64');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            user: user,
            token: token
          },
          message: `Добро пожаловать, ${user.firstName}!`
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email и пароль обязательны' })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Неверный формат данных' })
    };
  }
}

async function handleRegister(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, username, firstName, lastName, password } = JSON.parse(event.body);

    if (!email || !username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, имя пользователя и пароль обязательны' })
      };
    }

    const user = {
      id: Date.now(),
      email: email,
      username: username,
      firstName: firstName || username,
      lastName: lastName || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || username)}&background=6366f1&color=fff`,
      role: 'user',
      joinedAt: new Date().toISOString(),
      stats: {
        booksRead: 0,
        clubsJoined: 0,
        reviewsWritten: 0,
        points: 10
      }
    };

    const token = Buffer.from(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 })).toString('base64');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          user: user,
          token: token
        },
        message: `Регистрация завершена! Добро пожаловать, ${user.firstName}!`
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Неверный формат данных' })
    };
  }
}

async function handleProfile(event, headers) {
  // Демо профиль пользователя
  const demoProfile = {
    id: 1,
    email: "demo@bookclub.ru",
    firstName: "Демо",
    lastName: "Пользователь",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Люблю читать классическую и современную литературу. Особенно увлечен русской прозой XIX века.",
    location: "Москва, Россия",
    joinedAt: "2024-01-01",
    stats: {
      booksRead: 47,
      clubsJoined: 3,
      reviewsWritten: 12,
      points: 850,
      level: "Знаток литературы"
    },
    preferences: {
      genres: ["Классика", "Современная проза", "История"],
      languages: ["ru", "en"],
      notifications: {
        email: true,
        push: false,
        clubUpdates: true,
        newBooks: true
      }
    },
    achievements: [
      { id: 1, name: "Первые шаги", description: "Прочитана первая книга", date: "2024-01-05" },
      { id: 2, name: "Критик", description: "Написан первый отзыв", date: "2024-01-15" },
      { id: 3, name: "Социальный читатель", description: "Вступление в первый клуб", date: "2024-02-01" }
    ]
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: demoProfile,
      message: 'Профиль загружен'
    })
  };
}