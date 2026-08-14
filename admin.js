/* ==========================================
   STOCK AUTO CONTROL
========================================== */

function statusUsesStock(status) {
  return [
    "confirmed",
    "delivery",
    "done"
  ].includes(status);
}


async function changeOrderStatus(id, newStatus) {

  try {

    /* BUYURTMANI BAZADAN YANGI HOLATDA OLAMIZ */

    const orderRows = await api(
      `orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
    );

    const freshOrder = orderRows?.[0];

    if (!freshOrder) {
      throw new Error(
        "Buyurtma topilmadi."
      );
    }


    const quantity = Math.max(
      1,
      Number(freshOrder.quantity || 1)
    );


    const productId =
      freshOrder.product_id;


    const stockAdjusted =
      freshOrder.stock_adjusted === true;


    const shouldUseStock =
      statusUsesStock(newStatus);


    /* ======================================
       STOCK KAMAYTIRISH
       Tasdiqlandi / Yetkazishda / Yakunlandi
    ====================================== */

    if (
      shouldUseStock &&
      !stockAdjusted
    ) {

      if (!productId) {

        /*
          Eski buyurtmalarda product_id bo‘lmasligi mumkin.
          Status ishlaydi, lekin stock avtomatik o‘zgarmaydi.
        */

        console.warn(
          "Bu eski buyurtmada product_id yo‘q."
        );

      } else {

        const productRows =
          await api(
            `products?select=id,name,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
          );


        const product =
          productRows?.[0];


        if (!product) {

          throw new Error(
            "Buyurtmadagi mahsulot topilmadi."
          );
        }


        const currentStock =
          Number(product.stock || 0);


        if (
          currentStock < quantity
        ) {

          alert(
            `Omborda yetarli mahsulot yo‘q.\n\nOmborda: ${currentStock} dona\nBuyurtma: ${quantity} dona`
          );

          return;
        }


        const newStock =
          currentStock - quantity;


        /* STOCKNI KAMAYTIRAMIZ */

        await api(
          `products?id=eq.${encodeURIComponent(productId)}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body: JSON.stringify({
              stock: newStock
            })
          }
        );


        /* BUYURTMADA BELGILAYMIZ */

        freshOrder.stock_adjusted =
          true;
      }
    }


    /* ======================================
       STOCKNI QAYTARISH

       Agar oldin stock kamaygan bo‘lsa,
       status Yangi / Gaplashildi / Bekor
       qilindiga qaytsa stockni qaytaramiz.
    ====================================== */

    if (
      !shouldUseStock &&
      stockAdjusted &&
      productId
    ) {

      const productRows =
        await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
        );


      const product =
        productRows?.[0];


      if (product) {

        const currentStock =
          Number(product.stock || 0);


        const newStock =
          currentStock + quantity;


        await api(
          `products?id=eq.${encodeURIComponent(productId)}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body: JSON.stringify({
              stock: newStock
            })
          }
        );
      }


      freshOrder.stock_adjusted =
        false;
    }


    /* ======================================
       ORDER STATUS UPDATE
    ====================================== */

    const payload = {

      status:
        newStatus,

      stock_adjusted:
        shouldUseStock && productId
          ? true
          : freshOrder.stock_adjusted,

      updated_at:
        new Date().toISOString()
    };


    if (
      newStatus === "talked"
    ) {

      payload.talked_at =
        new Date().toISOString();
    }


    await api(
      `orders?id=eq.${encodeURIComponent(id)}`,
      {
        method:
          "PATCH",

        headers: {

          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );


    /* ======================================
       LOCAL DATA UPDATE
    ====================================== */

    const localOrder =
      orders.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    if (localOrder) {

      localOrder.status =
        newStatus;

      localOrder.stock_adjusted =
        payload.stock_adjusted;

      localOrder.updated_at =
        payload.updated_at;


      if (
        newStatus === "talked"
      ) {

        localOrder.talked_at =
          payload.talked_at;
      }
    }


    /* PRODUCT STOCKNI QAYTA YUKLAYMIZ */

    await loadProducts();


    updateStats();

    updateOrderStats();

    renderOrders();


  } catch (error) {

    console.error(
      "Status / stock xatosi:",
      error
    );


    alert(
      error.message ||
      "Statusni o‘zgartirib bo‘lmadi."
    );
  }
}
