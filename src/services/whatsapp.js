import { storeInfo } from '../data';

export function generateWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${storeInfo.whatsapp}?text=${encoded}`;
}

export function generateEnquiryMessage(product, customerInfo) {
  const { name, phone, email, message } = customerInfo;

  return `Hello Ashu Silks! 👋

I'm interested in the following product:

*${product.name}*
SKU: ${product.sku}
Price: ₹${product.price}

*My Details:*
Name: ${name}
Phone: ${phone}
${email ? `Email: ${email}` : ''}

*Message:*
${message || 'I would like to know more about this product.'}

Looking forward to your response!`;
}

export function generateOrderMessage(order) {
  const itemsList = order.items.map(item =>
    `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`
  ).join('\n');

  return `New Order Placed! 🎉

*Order ID:* ${order.id}

*Items:*
${itemsList}

*Total:* ₹${order.total}

*Shipping Address:*
${order.address.name}
${order.address.phone}
${order.address.addressLine1}
${order.address.addressLine2 ? order.address.addressLine2 + '\n' : ''}${order.address.city}, ${order.address.state} - ${order.address.pincode}

*Payment Method:* ${order.paymentMethod}${order.paymentMethod === 'UPI' ? '\n*Payment status:* Customer will confirm once paid' : ''}`;
}

export function generatePaymentConfirmedMessage(order) {
  return `Payment reported for Order ${order.id} 💰

The customer says they've completed the UPI payment of ₹${order.total} for order ${order.id}. This is NOT gateway-verified — please check your UPI app before dispatching.`;
}
