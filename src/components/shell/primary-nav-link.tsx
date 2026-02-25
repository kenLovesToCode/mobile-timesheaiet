import { Link, type Href } from 'expo-router';
import { Pressable } from 'react-native';
import { Paragraph, useTheme } from 'tamagui';

type PrimaryNavLinkProps = {
  href: Href;
  label: string;
};

export function PrimaryNavLink({ href, label }: PrimaryNavLinkProps) {
  const theme = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => ({
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.borderColor.val,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Paragraph selectable={false}>{label}</Paragraph>
      </Pressable>
    </Link>
  );
}
