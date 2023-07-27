import axios from 'axios';

export class MenuShopUtil {
  async getMenuFood(shopLink: string) {
    const config = {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'sec-ch-ua':
          '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'x-foody-access-token': '',
        'x-foody-api-version': '1',
        'x-foody-app-type': '1004',
        'x-foody-client-id': '',
        'x-foody-client-language': 'vi',
        'x-foody-client-type': '1',
        'x-foody-client-version': '3.0.0',
        Referer: 'https://shopeefood.vn/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };

    const getShopUrl = shopLink.split('https://shopeefood.vn/')[1];

    const urlGetShopId = `https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=${getShopUrl}`;

    const shopId = (await axios.get(urlGetShopId, config)).data?.reply
      .delivery_id;

    const urlGetShopMenu = `https://gappapi.deliverynow.vn/api/dish/get_delivery_dishes?id_type=2&request_id=${shopId}`;

    const reponseData = (await axios.get(urlGetShopMenu, config)).data;

    const menuFoodFormated = reponseData.reply.menu_infos.map((v) => {
      const optionsFood =
        v.options !== undefined
          ? v.options.map((op) => {
              const optionItems =
                op.option_items.items !== undefined
                  ? op.option_items.items.map((opi) => {
                      const optionItem = {
                        name: opi.name,
                        price: opi.price.value,
                      };

                      return optionItem;
                    })
                  : '';

              const option = {
                id: op.id,
                mandatory: op.mandatory,
                name: op.name,
                option_items: optionItems,
              };
              return option;
            })
          : '';

      const menuFood = {
        dish_type_id: v.dish_type_id,
        dish_type_name: v.dish_type_name,
        description: v.description,
        price: v.dishes[0].price.value,
        discount_price: v.dishes[0].discount_price.value,
        photo: v.dishes[0].photos[0].value,
        options: optionsFood,
      };

      return menuFood;
    });

    return menuFoodFormated;
  }
}
