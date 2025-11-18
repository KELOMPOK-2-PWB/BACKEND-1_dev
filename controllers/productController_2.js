const Product = require('../models/Product');


//Endpoint get all barang di sisi user
// /api/products-users
exports.getAvailableProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('seller', 'name sellerInfo.store')
            .sort({ createdAt: -1 }); // urutan barang paling terbaru

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data produk", error: error.message });
    }
};


//filter barang
// /api/products-users/search?

// /api/products-users?search=kaos
// /api/products-users?category=Pakaian&sort=newest

exports.getAvailableProductsCustom = async (req, res) => {
    try {
        let filter = {};
        let sortOptions = { createdAt: -1 };


        if (req.query.search) {
            filter.name = {
                $regex: req.query.search, // Mencari teks yang mengandung yang user inpit
                $options: 'i' // 'i' = case insensitive (jadi ini gak bakal ngaruh mau huruf besar/ kecil)
            };
        }
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.status === 'available') {
            const now = new Date();
            const stockFilter = { $expr: { $gt: ["$quantity", "$sold"] } };
            const availabilityFilter = {
                $or: [
                    { isDropItem: false },
                    {
                        isDropItem: true,
                        dropStart: { $lte: now },
                        dropEnd: { $gte: now }
                    }
                ]
            };
            filter = { ...filter, ...stockFilter, ...availabilityFilter };
        }

        if (req.query.sort) {
            const sortValue = req.query.sort;
            if (sortValue === 'termurah' || sortValue === '') {
                sortOptions = { price: 1 };
            } else if (sortValue === 'termahal') {
                sortOptions = { price: -1 };
            } else if (sortValue === 'terbaru') {
                sortOptions = { createdAt: -1 };
            } else if (sortValue === 'belumDiDrop') {
                const now = new Date();
                filter.isDropItem = true;
                filter.dropStart = { $gt: now };xs
                sortOptions = { dropStart: 1 };
            } else {
                console.log(`input FE salah ${sortValue} tidak ada`)
                return res.status(400).json({
                    message:`nilai dari '${sortValue}' tidak ada, input nya hanya, termurah, termahal, terbaru, belumDiDrop`
                });
            }
        }

        const products = await Product.find(filter)
            .populate('seller', 'name sellerInfo.store')
            .sort(sortOptions);

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data produk", error: error.message });
    }
};