import { GroupedBy } from '../enums/grouped-by.enum';

export const getGroupFoodOrderQuery = (
  sessionId: number,
  groupedBy: GroupedBy,
): string => {
  switch (groupedBy) {
    case GroupedBy.food:
      return `
                SELECT 
                  food_name as foodName
                  ,food_image as foodImage
                  ,JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'id', food_orders.id, 
                          'user', JSON_OBJECT(
                              'googleId', google_id, 
                              'email', email, 
                              'name', NAME, 
                              'photo', photo
                              ),
                          'originPrice', origin_price, 
                           'quantity', quantity, 
                          'note', note, 
                          'options', JSON_EXTRACT(options, '$'), 
                          'actualPrice', actual_price
                              )
                       ) AS orders
                   ,SUM(food_order_total) + SUM(option_total) AS total
                  FROM 
                      (SELECT 
                          id
                          ,MAX(session_id) AS session_id
                          ,MAX(user_id) AS user_id
                          ,MAX(food_name) AS food_name
                          ,MAX(food_image) AS food_image
                          ,MAX(origin_price) AS origin_price
                          ,MAX(options) AS options
                          ,MAX(quantity) AS quantity
                          ,MAX(note) AS note
                          ,MAX(actual_price) AS actual_price
                          ,COALESCE(MAX(quantity) * SUM(price), 0) AS option_total
                          ,(quantity * actual_price) AS food_order_total
              
                      FROM food_order fo 
                      
                      LEFT OUTER JOIN 
                      
                          JSON_TABLE(
                              fo.options, '$[*]' COLUMNS(
                                  NESTED PATH '$.detail[*]' COLUMNS(
                                  price INT PATH '$.price'
                                  )
                              )
                          ) opt_jsontable
                      
                      ON true 
                      
                      WHERE fo.session_id = ${sessionId}
                      
                      GROUP BY id
                      ) AS food_orders
                      
                      LEFT JOIN user u ON food_orders.user_id = u.id
                      
                      LEFT JOIN 
                          (SELECT (shipping_fee + other_fee - discount_amount) AS fee, session_id
                              FROM session_payment sp
                              ) AS ss_payment
                      ON food_orders.session_id = ss_payment.session_id
              
                  GROUP BY food_name, food_image
                `;

    case GroupedBy.user:
      return `
                SELECT 
                  JSON_OBJECT(
                      'googleId', google_id, 
                      'email', email, 
                      'name', name, 
                      'photo', photo
                      ) AS user
                  ,JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'foodName', food_name, 
                          'foodImage', food_image, 
                          'id', food_orders.id, 
                          'originPrice', origin_price, 
                          'quantity', quantity, 
                          'note', note, 
                          'options', JSON_EXTRACT(options, '$'),					
                          'actualPrice', actual_price
                          )
                      ) AS orders
                  ,SUM(food_order_total) + SUM(option_total) AS totalPayment 
                  ,CAST(
                      (SUM(food_order_total) + SUM(option_total)) + (MAX(fee) / (COUNT(user_id) OVER ())) AS DECIMAL(64,2)
                  ) AS finalPayment
                  FROM 
                  (SELECT 
                      id
                      ,MAX(session_id) AS session_id
                      ,MAX(user_id) AS user_id
                      ,MAX(food_name) AS food_name
                      ,MAX(food_image) AS food_image
                      ,MAX(origin_price) AS origin_price
                      ,MAX(options) AS options
                      ,MAX(quantity) AS quantity
                      ,MAX(note) AS note
                      ,MAX(actual_price) AS actual_price
                      ,COALESCE(MAX(quantity) * SUM(price), 0) AS option_total
                      ,(quantity * actual_price) AS food_order_total
              
                  FROM food_order fo 
                  
                  LEFT OUTER JOIN 
                  
                      JSON_TABLE(
                          fo.options, '$[*]' COLUMNS(
                              NESTED PATH '$.detail[*]' COLUMNS(
                              price INT PATH '$.price'
                              )
                          )
                      ) opt_jsontable
                  
                  ON true 
                  
                  WHERE fo.session_id = ${sessionId}
                  
                  GROUP BY id
                  ) AS food_orders
                  
                  LEFT JOIN user u ON food_orders.user_id = u.id
                  
                  LEFT JOIN 
                      (SELECT (shipping_fee + other_fee - discount_amount) AS fee, session_id
                          FROM session_payment sp
                          ) AS ss_payment
                  ON food_orders.session_id = ss_payment.session_id
                  GROUP BY user_id
                  `;
  }
};
