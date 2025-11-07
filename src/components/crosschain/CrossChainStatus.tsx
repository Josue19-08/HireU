"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCrossChainOperation } from "@/hooks/useCrossChain";
import { CHAIN_NAMES } from "@/config/contracts";
import { Loader2, CheckCircle2, XCircle, Clock, Send } from "lucide-react";

interface CrossChainStatusProps {
  messageHash: string | null;
  operationType?: string;
}

export function CrossChainStatus({ messageHash, operationType }: CrossChainStatusProps) {
  const { operation, isLoading } = useCrossChainOperation(messageHash);

  if (!messageHash) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "Failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Sent":
        return <Send className="h-5 w-5 text-blue-500" />;
      case "Received":
        return <CheckCircle2 className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Received":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Cross-Chain Operation Status</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
      </div>

      {operation ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge className={getStatusColor(operation.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(operation.status)}
                {operation.status}
              </div>
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Operation Type:</span>
              <p className="font-medium">{operation.operationType}</p>
            </div>
            <div>
              <span className="text-gray-600">Operation ID:</span>
              <p className="font-medium">#{operation.operationId}</p>
            </div>
            <div>
              <span className="text-gray-600">Source Chain:</span>
              <p className="font-medium">
                {CHAIN_NAMES[parseInt(operation.sourceChainId)] || operation.sourceChainId}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Destination Chain:</span>
              <p className="font-medium">
                {CHAIN_NAMES[parseInt(operation.destinationChainId)] || operation.destinationChainId}
              </p>
            </div>
          </div>

          {operation.messageHash && (
            <div className="pt-2 border-t">
              <span className="text-xs text-gray-500">Message Hash:</span>
              <p className="text-xs font-mono break-all">{operation.messageHash}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading operation status...</p>
        </div>
      )}
    </Card>
  );
}

