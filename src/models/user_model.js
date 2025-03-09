export function mapToUser (firstName, lastName, email, country, city, address, basket) {
    return {
        firstname: firstName,
        lastname: lastName,
        email: email,
        address: {
            country: country,
            city: city,
            address: address,
        },
        basket: basket,
        role: "customer",
        invoices: [],
        orders: [],
        comments: []
    }
}