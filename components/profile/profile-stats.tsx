interface ProfileStatsProps {
  postsCount: number;
  savedCount: number;
}

export function ProfileStats({ postsCount, savedCount }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-secondary text-center">
        <p className="text-2xl font-bold">{postsCount}</p>
        <p className="text-xs text-muted-foreground">Posts</p>
      </div>
      <div className="p-4 rounded-xl bg-secondary text-center">
        <p className="text-2xl font-bold">{savedCount}</p>
        <p className="text-xs text-muted-foreground">Saved</p>
      </div>
    </div>
  );
}
