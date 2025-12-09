import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Auth {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  magic_token!: string;

  @Column({ type: 'boolean', default: false })
  active!: boolean;

  @ManyToOne(() => User, (user) => user.auths, { onDelete: 'CASCADE' })
  user!: User;
}
