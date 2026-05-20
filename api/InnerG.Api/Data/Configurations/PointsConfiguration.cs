using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class PointRuleConfiguration : IEntityTypeConfiguration<PointRule>
    {
        public void Configure(EntityTypeBuilder<PointRule> builder)
        {
            builder.Property(x => x.RuleType).HasConversion<string>();
            builder.Property(x => x.ConditionType).HasConversion<string>();
            builder.Property(x => x.ConditionOperator).HasConversion<string>();
        }
    }

    public class InnerGPointsLedgerConfiguration : IEntityTypeConfiguration<InnerGPointsLedger>
    {
        public void Configure(EntityTypeBuilder<InnerGPointsLedger> builder)
        {
            builder.Property(x => x.Type).HasConversion<string>();
            builder.HasOne(x => x.User).WithMany(u => u.PointsLedger).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
