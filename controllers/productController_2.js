const Product = require('../models/Product');
const User = require('../models/Users');

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
// /api/products-users/search?search=kaos
// /api/products-users/search?category=Pakaian&sort=newest

exports.getAvailableProductsCustom = async (req, res) => {
    try {
        let filter = {};
        let sortOptions = { createdAt: -1 };

        //  =========== Filter 1 pencarian normal bedasarkan judul barang =========
        if (req.query.search) {
            filter.name = {
                $regex: req.query.search, // Mencari teks yang mengandung yang user input
                $options: 'i' // 'i' = case insensitive (jadi ini gak bakal ngaruh mau huruf besar/ kecil)
            };
        }

        // ========== Filter 2 by category barang nya apa ==============
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // ========= Filter 3 cek status dari barang (stock dan waktu drop) ============
        if (req.query.status === 'ProductDrop') {
            const now = new Date();
            const stockFilter = { $expr: { $gt: ["$quantity", "$sold"] } };
            const availabilityFilter = {
                $or: [
                    { isDropActive: true },
                ]
            };
            filter = { ...filter, ...stockFilter, ...availabilityFilter };
        }


        // =========== Filter 4 cek dari sort/ urutan ============
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
                filter.dropStart = { $gt: now };
                sortOptions = { dropStart: 1 };
            } else {
                console.log(`input FE salah ${sortValue} tidak ada`)
                return res.status(400).json({
                    message:`nilai dari '${sortValue}' tidak ada, input nya hanya, termurah, termahal, terbaru, belumDiDrop`
                });
            }
        }


        // ========== Filter 5 cek abrang iklan == true
        if (req.query.isAdvertised === 'true') {
            filter.isAdvertised = true;
        }



        const products = await Product.find(filter)
            .populate('seller', 'name sellerInfo.store')
            .sort(sortOptions);

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data produk", error: error.message });
    }
};


// search seller
// /api/products-users/search-store?name=
exports.searchStores = async (req, res) => {
    try {
        const { name } = req.query;
        let filter = { role: 'seller' };
        if (name) {
            filter.$or = [
                { name: { $regex: name, $options: 'i' } },
                { 'sellerInfo.store': { $regex: name, $options: 'i' } }
            ];
        }
        const stores = await User.find(filter)
            .select('name avatar sellerInfo addresses isVerifiedAccount createdAt');

        res.status(200).json(stores);

    } catch (error) {
        res.status(500).json({ message: 'Gagal mencari toko', error: error.message });
    }
};




