export default async tx => {
  const { logs } = await tx;
  return logs.map(log => ({ name: log.event, args: log.args })); // as Array<{ name: string, args: object }>
};
