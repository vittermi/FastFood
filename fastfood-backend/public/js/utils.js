import { getDecodedJWT, authFetch } from './auth.js';

export async function getRestaurantId() {
    const payload = getDecodedJWT();
    const userID = payload.id;

    const restaurantResponse = await authFetch(`/api/restaurants/?owner=${userID}`);

    if (!restaurantResponse.ok) throw new Error('Failed to fetch restaurant');

    const restaurantData = await restaurantResponse.json();
    if (!restaurantData.length) throw new Error('No restaurant found for this user');

    return restaurantData[0]._id;
}