import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { OrderStatus, type Order, type CartItem, type User, type Restaurant } from '../types';
import { connectDB, getPool, sql } from './db.js';

// Define __dirname for ES module scope.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the database on startup
connectDB().catch(err => {
    console.error("Failed to connect to DB on startup", err);
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Helper to get managed restaurant IDs for a user
const getManagedRestaurantIds = async (userId: string) => {
    const pool = getPool();
    const result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query('SELECT restaurantId FROM AdministeredRestaurants WHERE userId = @userId');
    return result.recordset.map(r => r.restaurantId);
};


// --- AUTH SERVICE LOGIC ---
const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');
        
        const user = result.recordset[0];
        
        if (user && user.password === password) { // In real app, use bcrypt.compare
            const { password: _, ...userToReturn } = user;
            
            if(user.role === 'RestaurantAdmin'){
                 userToReturn.managedRestaurantIds = await getManagedRestaurantIds(user.id);
            }

            res.json(userToReturn);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

authRouter.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const pool = getPool();
        // Check if user exists
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM Users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        
        const newUserId = `user${Date.now()}`;
        
        await pool.request()
            .input('id', sql.NVarChar, newUserId)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password) // In real app, hash password
            .query(`INSERT INTO Users (id, name, email, password, loyaltyPoints, role) 
                    VALUES (@id, @name, @email, @password, 0, 'Customer')`);

        const newUser: Omit<User, 'password'> = {
            id: newUserId,
            name,
            email,
            loyaltyPoints: 0,
            role: 'Customer'
        };

        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

app.use('/auth', authRouter);

// --- USER SERVICE LOGIC ---
const userRouter = express.Router();
userRouter.patch('/:userId/points', async (req, res) => {
    const { userId } = req.params;
    const { pointsToAdd } = req.body;

    if (typeof pointsToAdd !== 'number') {
        return res.status(400).json({ message: 'pointsToAdd must be a number' });
    }

    try {
        const pool = getPool();
        await pool.request()
            .input('userId', sql.NVarChar, userId)
            .input('pointsToAdd', sql.Int, pointsToAdd)
            .query('UPDATE Users SET loyaltyPoints = loyaltyPoints + @pointsToAdd WHERE id = @userId');
        
        res.status(200).json({ message: 'Points updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update points' });
    }
});

userRouter.get('/:userId', async (req, res) => {
     const { userId } = req.params;
     try {
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.NVarChar, userId)
            .query('SELECT id, name, email, loyaltyPoints, role FROM Users WHERE id = @userId');
        
        const user = result.recordset[0];
        if(user) {
            if(user.role === 'RestaurantAdmin') {
                user.managedRestaurantIds = await getManagedRestaurantIds(user.id);
            }
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
     } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
     }
});
app.use('/users', userRouter);


// --- RESTAURANT SERVICE LOGIC ---
const restaurantRouter = express.Router();

restaurantRouter.get('/', async (req: Request, res: Response) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM Restaurants');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch restaurants' });
    }
});

restaurantRouter.post('/', async (req: Request, res: Response) => {
    const { name, description, creatorId } = req.body;
    if (!name || !description || !creatorId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const newRestaurantId = `res${Date.now()}`;
        const newTableId = `t1_${newRestaurantId}`;

        await transaction.request()
            .input('id', sql.NVarChar, newRestaurantId)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .query('INSERT INTO Restaurants (id, name, description) VALUES (@id, @name, @description)');
        
        await transaction.request()
            .input('id', sql.NVarChar, newTableId)
            .input('name', sql.NVarChar, 'Table 1')
            .input('restaurantId', sql.NVarChar, newRestaurantId)
            .query('INSERT INTO Tables (id, name, restaurantId) VALUES (@id, @name, @restaurantId)');

        await transaction.request()
            .input('userId', sql.NVarChar, creatorId)
            .query("UPDATE Users SET role = 'RestaurantAdmin' WHERE id = @userId");
        
        await transaction.request()
            .input('userId', sql.NVarChar, creatorId)
            .input('restaurantId', sql.NVarChar, newRestaurantId)
            .query('INSERT INTO AdministeredRestaurants (userId, restaurantId) VALUES (@userId, @restaurantId)');
        
        await transaction.commit();

        const userResult = await pool.request().input('id', sql.NVarChar, creatorId).query('SELECT * from Users where id = @id');
        const user = userResult.recordset[0];
        const { password, ...updatedUser } = user;
        updatedUser.managedRestaurantIds = await getManagedRestaurantIds(creatorId);
        
        const newRestaurant: Restaurant = { id: newRestaurantId, name, description };
        res.status(201).json({ restaurant: newRestaurant, updatedUser });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: 'Failed to create restaurant' });
    }
});

restaurantRouter.get('/:restaurantId', async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('restaurantId', sql.NVarChar, restaurantId)
            .query('SELECT * FROM Restaurants WHERE id = @restaurantId');
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch restaurant' });
    }
});

// Table routes
restaurantRouter.get('/:restaurantId/tables', async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('restaurantId', sql.NVarChar, restaurantId)
            .query('SELECT * FROM Tables WHERE restaurantId = @restaurantId');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch tables' });
    }
});

restaurantRouter.post('/:restaurantId/tables', async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const { name } = req.body;
    try {
        const pool = getPool();
        const newTable = {
            id: `tbl${Date.now()}`,
            name,
            restaurantId
        };
        await pool.request()
            .input('id', sql.NVarChar, newTable.id)
            .input('name', sql.NVarChar, newTable.name)
            .input('restaurantId', sql.NVarChar, newTable.restaurantId)
            .query('INSERT INTO Tables (id, name, restaurantId) VALUES (@id, @name, @restaurantId)');
        res.status(201).json(newTable);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add table' });
    }
});

restaurantRouter.put('/:restaurantId/tables/:tableId', async (req: Request, res: Response) => {
    const { tableId } = req.params;
    const { name } = req.body;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, tableId)
            .input('name', sql.NVarChar, name)
            .query('UPDATE Tables SET name = @name WHERE id = @id');
        
        if (result.rowsAffected[0] > 0) {
            const updatedTableResult = await pool.request().input('id', sql.NVarChar, tableId).query('SELECT * FROM Tables WHERE id = @id');
            res.json(updatedTableResult.recordset[0]);
        } else {
            res.status(404).json({ message: 'Table not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update table' });
    }
});

restaurantRouter.delete('/:restaurantId/tables/:tableId', async (req: Request, res: Response) => {
    const { tableId } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, tableId)
            .query('DELETE FROM Tables WHERE id = @id');
        
        if (result.rowsAffected[0] > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Table not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete table' });
    }
});

app.use('/restaurants', restaurantRouter);

// --- MENU SERVICE LOGIC ---
const menuRouter = express.Router();

menuRouter.get('/items', async (req: Request, res: Response) => {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('restaurantId', sql.NVarChar, restaurantId)
            .query('SELECT * FROM MenuItems WHERE restaurantId = @restaurantId');
        const items = result.recordset.map(item => ({...item, tags: item.tags ? item.tags.split(',') : [] }));
        res.json(items);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get menu items'});
    }
});

menuRouter.post('/items', async (req, res) => {
    const { name, description, price, image, categoryId, tags, restaurantId } = req.body;
    const newItem = {
        id: `item${Date.now()}`,
        name, description, price, image, categoryId,
        tags: tags?.join(','),
        restaurantId
    };
    try {
        const pool = getPool();
        await pool.request()
            .input('id', sql.NVarChar, newItem.id)
            .input('name', sql.NVarChar, newItem.name)
            .input('description', sql.NVarChar, newItem.description)
            .input('price', sql.Decimal(10, 2), newItem.price)
            .input('image', sql.NVarChar, newItem.image)
            .input('categoryId', sql.NVarChar, newItem.categoryId)
            .input('tags', sql.NVarChar, newItem.tags)
            .input('restaurantId', sql.NVarChar, newItem.restaurantId)
            .query(`INSERT INTO MenuItems (id, name, description, price, image, categoryId, tags, restaurantId) VALUES (@id, @name, @description, @price, @image, @categoryId, @tags, @restaurantId)`);
        
        res.status(201).json({ ...newItem, tags: tags || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create menu item' });
    }
});

menuRouter.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, image, categoryId, tags } = req.body;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('price', sql.Decimal(10, 2), price)
            .input('image', sql.NVarChar, image)
            .input('categoryId', sql.NVarChar, categoryId)
            .input('tags', sql.NVarChar, tags?.join(','))
            .query(`UPDATE MenuItems SET name=@name, description=@description, price=@price, image=@image, categoryId=@categoryId, tags=@tags WHERE id=@id`);
        
        if (result.rowsAffected[0] > 0) {
            const updatedItemResult = await pool.request().input('id', sql.NVarChar, id).query('SELECT * FROM MenuItems WHERE id = @id');
            const item = updatedItemResult.recordset[0];
            res.json({ ...item, tags: item.tags ? item.tags.split(',') : [] });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update item'});
    }
});

menuRouter.delete('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM MenuItems WHERE id = @id');
        
        if (result.rowsAffected[0] > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete item' });
    }
});

menuRouter.get('/categories', async (req: Request, res: Response) => {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('restaurantId', sql.NVarChar, restaurantId)
            .query('SELECT * FROM Categories WHERE restaurantId = @restaurantId');
        res.json(result.recordset);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get categories'});
    }
});

menuRouter.post('/categories', async (req, res) => {
    const { name, parentId, restaurantId } = req.body;
    const newCategory = { id: `cat${Date.now()}`, name, parentId, restaurantId };
    try {
        const pool = getPool();
        await pool.request()
            .input('id', sql.NVarChar, newCategory.id)
            .input('name', sql.NVarChar, newCategory.name)
            .input('restaurantId', sql.NVarChar, newCategory.restaurantId)
            .input('parentId', sql.NVarChar, newCategory.parentId)
            .query('INSERT INTO Categories (id, name, restaurantId, parentId) VALUES (@id, @name, @restaurantId, @parentId)');
        res.status(201).json(newCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create category' });
    }
});

menuRouter.put('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, parentId } = req.body;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, name)
            .input('parentId', sql.NVarChar, parentId)
            .query('UPDATE Categories SET name = @name, parentId = @parentId WHERE id = @id');

        if (result.rowsAffected[0] > 0) {
            const updatedCatResult = await pool.request().input('id', sql.NVarChar, id).query('SELECT * FROM Categories WHERE id = @id');
            res.json(updatedCatResult.recordset[0]);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update category' });
    }
});

menuRouter.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM Categories WHERE id = @id');

        if (result.rowsAffected[0] > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete category' });
    }
});

app.use('/menu', menuRouter);

// --- ORDER SERVICE LOGIC ---
const orderRouter = express.Router();

orderRouter.get('/', async (req, res) => {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });

    try {
        const pool = getPool();
        const ordersResult = await pool.request()
            .input('restaurantId', sql.NVarChar, restaurantId)
            .query('SELECT * FROM Orders WHERE restaurantId = @restaurantId ORDER BY timestamp DESC');
        
        const ordersData: Order[] = [];
        for (const orderRecord of ordersResult.recordset) {
            const itemsResult = await pool.request()
                .input('orderId', sql.NVarChar, orderRecord.id)
                .query(`
                    SELECT oi.quantity, oi.notes, mi.* 
                    FROM OrderItems oi
                    JOIN MenuItems mi ON oi.menuItemId = mi.id
                    WHERE oi.orderId = @orderId
                `);
            
            const cartItems: CartItem[] = itemsResult.recordset.map(itemRecord => ({
                quantity: itemRecord.quantity,
                notes: itemRecord.notes,
                menuItem: {
                    id: itemRecord.id,
                    name: itemRecord.name,
                    description: itemRecord.description,
                    price: parseFloat(itemRecord.price),
                    image: itemRecord.image,
                    categoryId: itemRecord.categoryId,
                    tags: itemRecord.tags ? itemRecord.tags.split(',') : [],
                    restaurantId: itemRecord.restaurantId
                }
            }));
            
            ordersData.push({
                ...orderRecord,
                total: parseFloat(orderRecord.total),
                items: cartItems
            });
        }
        res.json(ordersData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get orders'});
    }
});

orderRouter.post('/', async (req, res) => {
    const { tableId, items, total, restaurantId, userId } = req.body as { items: CartItem[] } & Omit<Order, 'id'|'status'|'timestamp'|'items'>;
    
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const newOrderId = `order${Date.now()}`;
        const timestamp = Date.now();

        await transaction.request()
            .input('id', sql.NVarChar, newOrderId)
            .input('tableId', sql.NVarChar, tableId)
            .input('status', sql.NVarChar, OrderStatus.Received)
            .input('timestamp', sql.BigInt, timestamp)
            .input('total', sql.Decimal(10, 2), total)
            .input('restaurantId', sql.NVarChar, restaurantId)
            .input('userId', sql.NVarChar, userId)
            .query(`INSERT INTO Orders (id, tableId, status, timestamp, total, restaurantId, userId)
                    VALUES (@id, @tableId, @status, @timestamp, @total, @restaurantId, @userId)`);

        for (const item of items) {
            await transaction.request()
                .input('orderId', sql.NVarChar, newOrderId)
                .input('menuItemId', sql.NVarChar, item.menuItem.id)
                .input('quantity', sql.Int, item.quantity)
                .input('notes', sql.NVarChar, item.notes)
                .input('priceAtOrder', sql.Decimal(10, 2), item.menuItem.price)
                .query(`INSERT INTO OrderItems (orderId, menuItemId, quantity, notes, priceAtOrder)
                        VALUES (@orderId, @menuItemId, @quantity, @notes, @priceAtOrder)`);
        }
        
        await transaction.commit();

        const createdOrder: Order = {
            id: newOrderId, tableId, items, total, restaurantId, userId,
            status: OrderStatus.Received,
            timestamp
        };
        res.status(201).json(createdOrder);

    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to place order' });
    }
});

orderRouter.patch('/:orderId/status', async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses: OrderStatus[] = Object.values(OrderStatus);
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }

    try {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, orderId)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Orders SET status = @status WHERE id = @id');
        
        if (result.rowsAffected[0] > 0) {
            const updatedOrderResult = await pool.request().input('id', sql.NVarChar, orderId).query('SELECT * FROM Orders WHERE id = @id');
            res.json(updatedOrderResult.recordset[0]);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update order status' });
    }
});

app.use('/orders', orderRouter);

// --- REVIEW SERVICE LOGIC ---
const reviewRouter = express.Router();
reviewRouter.get('/', async (req, res) => {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });
    try {
        const pool = getPool();
        const request = pool.request();
        request.input('restaurantId', sql.NVarChar, restaurantId);
        const result = await request.query(`
            SELECT r.*, u.name as userName 
            FROM Reviews r
            JOIN Users u ON r.userId = u.id
            WHERE r.restaurantId = @restaurantId 
            ORDER BY r.timestamp DESC
        `);
        res.json(result.recordset);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch reviews"});
    }
});

reviewRouter.post('/', async (req, res) => {
    const { menuItemId, restaurantId, rating, comment, userId } = req.body;
    const newReview = {
        id: `rev${Date.now()}`,
        menuItemId, restaurantId, rating, comment, userId,
        timestamp: Date.now()
    };
    try {
        const pool = getPool();
        await pool.request()
            .input('id', sql.NVarChar, newReview.id)
            .input('menuItemId', sql.NVarChar, newReview.menuItemId)
            .input('restaurantId', sql.NVarChar, newReview.restaurantId)
            .input('rating', sql.Int, newReview.rating)
            .input('comment', sql.NVarChar, newReview.comment)
            .input('userId', sql.NVarChar, newReview.userId)
            .input('timestamp', sql.BigInt, newReview.timestamp)
            .query('INSERT INTO Reviews (id, menuItemId, restaurantId, rating, comment, userId, timestamp) VALUES (@id, @menuItemId, @restaurantId, @rating, @comment, @userId, @timestamp)');
        
        const result = await pool.request()
            .input('reviewId', sql.NVarChar, newReview.id)
            .query(`
                SELECT r.*, u.name as userName
                FROM Reviews r
                JOIN Users u ON r.userId = u.id
                WHERE r.id = @reviewId
            `);

        res.status(201).json(result.recordset[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create review"});
    }
});

app.use('/reviews', reviewRouter);

// SPA Fallback - Serve index.html for any non-API, non-file requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`QR Dine Backend Server running on http://localhost:${PORT}`);
});