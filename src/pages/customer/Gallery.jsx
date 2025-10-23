const Gallery = () => {
  // Sample gallery data - in a real app, this would come from your API
  const galleryItems = [
    {
      id: 1,
      title: "Fresh Burgers",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      category: "Burgers"
    },
    {
      id: 2,
      title: "Delicious Pizza",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      category: "Pizza"
    },
    {
      id: 3,
      title: "Fresh Cakes",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
      category: "Cakes"
    },
    {
      id: 4,
      title: "Chicken Wings",
      image: "https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400",
      category: "Wings"
    },
    {
      id: 5,
      title: "Tasty Momos",
      image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
      category: "Momos"
    },
    {
      id: 6,
      title: "Fresh Rolls",
      image: "https://images.unsplash.com/photo-1606755962773-d324e4c6b701?w=400",
      category: "Rolls"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Gallery</h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Take a visual journey through our delicious offerings. Each dish is prepared with love and the finest ingredients.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <div key={item.id} className="card overflow-hidden group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition duration-300 text-white text-center">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm bg-primary px-3 py-1 rounded-full inline-block">
                      {item.category}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.category}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Want to taste what you see? Order now and experience the flavors!
          </p>
          <a href="/menu" className="btn-primary">Order Now</a>
        </div>
      </div>
    </div>
  );
};

export default Gallery;

