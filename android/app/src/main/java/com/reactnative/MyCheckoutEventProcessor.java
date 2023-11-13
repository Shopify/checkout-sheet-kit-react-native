package com.reactnative;

import android.content.Context;
import com.shopify.checkoutkit.*;

public class MyCheckoutEventProcessor extends DefaultCheckoutEventProcessor {
    public MyCheckoutEventProcessor(Context context) {
        super(context);
    }

    @Override
    public void onCheckoutCompleted() {
        // Handle checkout completion
    }

    @Override
    public void onCheckoutFailed(CheckoutException error) {
        // Handle checkout failure
    }

    @Override
    public void onCheckoutCanceled() {
        // Handle checkout cancellation
    }
}
