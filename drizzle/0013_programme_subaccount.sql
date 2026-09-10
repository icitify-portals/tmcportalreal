-- Per-programme Paystack subaccount override (route fees for select programmes to another account)
ALTER TABLE `programmes`
  ADD COLUMN `paystackSubaccountCode` varchar(255) AFTER `pricingTiers`,
  ADD COLUMN `progBankName` varchar(255) AFTER `paystackSubaccountCode`,
  ADD COLUMN `progBankCode` varchar(100) AFTER `progBankName`,
  ADD COLUMN `progBankAccountNumber` varchar(50) AFTER `progBankCode`,
  ADD COLUMN `progBankAccountName` varchar(255) AFTER `progBankAccountNumber`;
