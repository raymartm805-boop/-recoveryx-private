package com.ippoxrecovery.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class TermuxResultReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        Bundle result = intent.getBundleExtra("result");
        if (result == null) {
            MainActivity.deliverTermuxResult("", "", -1, "Termux returned no result bundle. Check that Termux is version 0.109 or newer.");
            return;
        }
        String stdout = result.getString("stdout", "");
        String stderr = result.getString("stderr", "");
        int exitCode = result.getInt("exitCode", -1);
        String error = result.getString("errmsg", "");
        MainActivity.deliverTermuxResult(stdout, stderr, exitCode, error);
    }
}
